/* eslint-disable */
import { queryMongo } from '../types/types';
import { getMatchFunc } from '../utils/recordCompareFunctions';
import mergeAllMergedObj from '../utils/mergeAllMergedObj';
import { findAndUpdateRecord } from '../utils/findAndUpdateRecord';
import fn from '../config/fieldNames';
import { MatchedRecord, MergedOBJ } from '../types/types';
import { mongoQueryByIds, getIdentifiers } from '../utils/identifiersUtils';
import { sendToQueue } from '../rabbit/init';
import { addToDb, findManyByIdentifiers } from '../mongo/repo';
import { addNewEntity } from '../utils/addNewEntity';
import { handleSourcesConflict } from '../utils/handleSourcesConflict';

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
 * @param newRecord A record received from basic match
 */
export async function matchedRecordHandler(newRecord: MatchedRecord) {
    // prepare to mongo $or QUERY
    const identifiers: queryMongo = mongoQueryByIds(newRecord.record);

    // find in mongo
    const mergedObjects: MergedOBJ[] = await findManyByIdentifiers(identifiers);

    if (!mergedObjects?.length) {
        await addNewEntity(newRecord);
    } /* need update*/ else {
        // get All identifiers from all records
        const foundIdentifiers: queryMongo = mergedObjects.reduce(
            (total: queryMongo, { identifiers }: MergedOBJ) => total.concat(mongoQueryByIds(identifiers)),
            [],
        );

        // to set the max lock on the new or updated object
        const maxLock = Math.max(...mergedObjects.map(({ lock }: MergedOBJ) => lock));

        // if there was multiple "people" in the merged db that belong to the same person, the we unify them into one mergedObj
        // by default merge into the first one in the array
        const mergedRecord: MergedOBJ = mergedObjects.length > 1 ? mergeAllMergedObj(mergedObjects) : mergedObjects[0];

        const source: string = newRecord.dataSource;
        const sourceReverted: string = fn.dataSourcesRevert[source];

        let updated: boolean = false;

        // mir vs city
        handleSourcesConflict(source, mergedRecord, newRecord);

        [mergedRecord[sourceReverted], updated] = findAndUpdateRecord(mergedRecord[sourceReverted], newRecord, getMatchFunc(sourceReverted));

        mergedRecord.identifiers = { ...getIdentifiers(mergedRecord.identifiers), ...getIdentifiers(newRecord.record) };

        if (updated) mergedRecord.updatedAt = new Date();
        mergedRecord.lock = maxLock + 1;

        // created insert session so that the delete many and insert one operations are an atomic unit
        // since other parallel runs on records of the same person can disrupt this process and vice versa
        await addToDb(foundIdentifiers, mergedRecord);
        // send to next service queue
        if (updated) await sendToQueue(mergedRecord); // send only if updated
    }
}
