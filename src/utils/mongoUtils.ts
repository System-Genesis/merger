/* eslint-disable */
import { ConsumerMessage } from 'menashmq';
import logger from 'logger-genesis';
import { queryMongo } from './types';
import * as compareFunctions from './recordCompareFunctions';
import { scopeOption } from './log';
import mergeAllMergedObj from './mergeAllMergedObj';
import { findAndUpdateRecord } from './findAndUpdateRecord';
import fn from '../config/fieldNames';
import { MatchedRecord, MergedOBJ } from './types';
import { prepareMongoQueryByIds, getIdentifiers, getFirstIdentifier } from './identifiersUtils';
import { sendToQueue } from '../rabbit';
import { addToDb, findManyByIdentifiers, insertOne } from './mongo';

const { logFields } = fn;
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

    const maxLock = Math.max(...mergedObjects.map((o: MergedOBJ) => o.lock)); // to set the max lock on the new or updated object

    // update and merge all existing merged objects
    if (mergedObjects?.length >= 1) {
        // if there was multiple "people" in the merged db that belong to the same person, the we unify them into one mergedObj
        // by default merge into the first one in the array

        mergeAllMergedObj(mergedObjects, matchedRecord);

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

        [mergedRecord[dataSourceRevert], updated] = findAndUpdateRecord(
            mergedRecord[dataSourceRevert],
            matchedRecord,
            mergedRecord[dataSourceRevert].userId ? compareFunctions.userIDCompare : compareFunctions.akaCompare,
        );

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
        const mergedRecord = <MergedOBJ>{};
        const recordDataSource: string = matchedRecord.dataSource;
        if (fn.dataSourcesRevert[recordDataSource] === undefined) {
            // error that not right source
        }
        matchedRecord.updatedAt = new Date();
        mergedRecord[fn.dataSourcesRevert[recordDataSource]] = [matchedRecord];
        mergedRecord.identifiers = {};
        if (matchedRecord.record.personalNumber) {
            mergedRecord.identifiers.personalNumber = matchedRecord.record.personalNumber;
        }
        if (matchedRecord.record.identityCard) {
            mergedRecord.identifiers.identityCard = matchedRecord.record.identityCard;
        }
        if (matchedRecord.record.goalUserId) {
            mergedRecord.identifiers.goalUserId = matchedRecord.record.goalUserId;
        }
        mergedRecord.updatedAt = new Date();

        mergedRecord.lock = 0;
        logger.info(
            false,
            logFields.scopes.app as scopeOption,
            'Added new person to DB',
            `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
            {
                id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                uniqueId: matchedRecord.record.userID,
                source: matchedRecord.dataSource,
            },
        );
        // save newMergeRecord in DB
        await insertOne(mergedRecord);
        // send to next service queue
        await sendToQueue(mergedRecord);
    }
}

function deleteSameRecordFromAnotherSource(mergedRecord: MergedOBJ, matchedRecord: MatchedRecord, delSource: string, newSource: string) {
    for (let i = 0; i < mergedRecord[delSource].length; i += 1) {
        if (mergedRecord[delSource][i].record.userID === matchedRecord.record.userID) {
            mergedRecord[delSource].splice(i, 1);
            logger.info(
                false,
                logFields.scopes.app as scopeOption,
                `Removed Datasource ${delSource} after adding Datasource ${newSource}`,
                `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}, uniqueID: ${
                    matchedRecord.record.userID
                }`,
                {
                    id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                    uniqueId: matchedRecord.record.userID,
                    source: matchedRecord.dataSource,
                },
            );
        }
    }

    if (mergedRecord[delSource].length == 0) delete mergedRecord[delSource]; // TODO check if right ADDED
}

/**
 * runs the function matchedRecordHandler on the received record, tries to insert it into the db, either to insert as new or to update.
 * sometimes when trying to insert multiple records at the same time, we get a db error 11000, and so we try again untill it enters the db.
 * if any other error occurs then stop the function and print the error.
 * @param msg a message sent from basic match, containing a basic matched record
 */
// TODO basicMatch
export async function consumeMerger(msg: ConsumerMessage) {
    const matchedRecord: MatchedRecord = msg.getContent() as MatchedRecord;
    while (true) {
        try {
            await matchedRecordHandler(matchedRecord);
        } catch (error: any) {
            if (error.code === 11000) {
                // logger.error(true, logFields.scopes.app as scopeOption, 'Parallel insert conflict', error.message);
                // console.log('error', error.message);
                continue;
            } else {
                // TODO: ADD {id: identifier}  -m add identifier
                logger.error(
                    false,
                    logFields.scopes.app as scopeOption,
                    'Error inserting person',
                    `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
                    {
                        id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                        uniqueId: matchedRecord.record.userID,
                        source: matchedRecord.dataSource,
                    },
                );
                // console.log('error', error.message);
                break;
            }
        }
        break;
    }
    msg.ack();
}
