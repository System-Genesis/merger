/* eslint-disable */
import { queryMongo } from '../types/types';
import * as compareFunctions from './recordCompareFunctions';
import mergeAllMergedObj from './mergeAllMergedObj';
import { findAndUpdateRecord } from './findAndUpdateRecord';
import fn from '../config/fieldNames';
import { MatchedRecord, MergedOBJ } from '../types/types';
import { prepareMongoQueryByIds, getIdentifiers } from './identifiersUtils';
import { sendToQueue } from '../rabbit/init';
import { addToDb, findManyByIdentifiers } from './mongo';
import { addNewEntity } from './newEntity';
import { deleteSameRecordFromAnotherSource } from './recordsSourceConflict';

/**
 * the functions goal is to insert the matchedRecord into the mongo db, either as an update or as a new
 * first we extract the identifiers found in the matchedRecord, and search the db using these identifiers.
 * if we didnt find any records in the db matching to our matchedRecord's identifiers, then we insert it into the db as a new (the 2nd small part of this function)
 * otherwise, if we found one record matching to our record, we check the source in the found db corrosponding to the source of matchedRecord
 * if its empty we add it and if its not we compare and update/do nothing/add (in the function findAndUpdateRecord)
 * if we find multiple objects in the db that have the same identifiers as the ones in matchedRecord,
 * then we conclude that these objects belong to the same person and we merge them into one object, and replace
 * the objects in the db with the singular merged object.
 *
 * @param matchedRecord A record received from basic match
 */
export async function matchedRecordHandler(matchedRecord: MatchedRecord) {
    // prepare to mongo $or QUERY
    const identifiers: any[] = prepareMongoQueryByIds(matchedRecord.record);

    // find in mongo
    const mergedObjects: MergedOBJ[] = await findManyByIdentifiers(identifiers);

    // get All identifiers from all records
    const foundIdentifiers: queryMongo = mergedObjects.reduce(
        (total: queryMongo, { identifiers }: MergedOBJ) => total.concat(prepareMongoQueryByIds(identifiers)),
        [],
    );

    const maxLock = Math.max(...mergedObjects.map(({ lock }: MergedOBJ) => lock)); // to set the max lock on the new or updated object

    // update and merge all existing merged objects
    if (mergedObjects?.length >= 1) {
        // if there was multiple "people" in the merged db that belong to the same person, the we unify them into one mergedObj
        // by default merge into the first one in the array

        mergeAllMergedObj(mergedObjects);

        // now we have only onw merge obj
        const mergedRecord: MergedOBJ = mergedObjects[0];
        const recordDataSource: string = matchedRecord.dataSource;
        const dataSourceRevert: string = fn.dataSourcesRevert[recordDataSource];
        let updated: boolean = false;

        if (recordDataSource == fn.dataSources.city && mergedRecord.mir) {
            deleteSameRecordFromAnotherSource(mergedRecord, matchedRecord, fn.dataSources.city, fn.dataSources.mir);
        } else if (recordDataSource == fn.dataSources.mir && mergedRecord.city) {
            deleteSameRecordFromAnotherSource(mergedRecord, matchedRecord, fn.dataSources.mir, fn.dataSources.city);
        }

        const matchFunc = dataSourceRevert != 'aka' ? compareFunctions.userIDCompare : compareFunctions.akaCompare;

        [mergedRecord[dataSourceRevert], updated] = findAndUpdateRecord(mergedRecord[dataSourceRevert], matchedRecord, matchFunc);

        mergedRecord.identifiers = { ...getIdentifiers(mergedRecord.identifiers), ...getIdentifiers(matchedRecord.record) };

        if (updated) mergedRecord.updatedAt = new Date();
        mergedRecord.lock = maxLock + 1;

        // created insert session so that the delete many and insert one operations are an atomic unit
        // since other parallel runs on records of the same person can disrupt this process and vice versa
        await addToDb(foundIdentifiers, mergedRecord);
        // send to next service queue
        if (updated) await sendToQueue(mergedRecord); // send only if updated
        //**  continue here */
    } /** create new */ else {
        // code gets here if no objects in the db were found matching the identifiers of the matchedRecord
        // so we build a new object and insert it into the db
        await addNewEntity(matchedRecord);
    }
}
