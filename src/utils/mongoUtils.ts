/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
import * as mongoose from 'mongoose';
import { ConsumerMessage, menash } from 'menashmq';
import logger from 'logger-genesis';
import config from '../config';
import * as compareFunctions from './recordCompareFunctions';
import personsDB from './models';
import { difference } from './difference';
import { scopeOption } from './log';

const dotenv = require('dotenv');

dotenv.config();
const fn = require('../config/fieldNames');

const { logFields } = fn;
const { mongo } = config;
export interface MatchedRecord {
    record: any;
    dataSource: string;
    timeStamp: string;
    updatedAt?: Date;
    lastPing?: Date;
}
interface identifiers {
    identityCard?: string;
    personalNumber?: string;
    goalUserId?: string;
}
interface MergedOBJ {
    aka?: MatchedRecord[];
    es?: MatchedRecord[];
    sf?: MatchedRecord[];
    adnn?: MatchedRecord[];
    city?: MatchedRecord[];
    mir?: MatchedRecord[]; // undefined incase of having to delete records
    identifiers: { personalNumber?: string; identityCard?: string; goalUserId?: string };
    updatedAt: Date;
    lock: number;
}
function getIdentifiers(record: any) {
    const ids: identifiers = {};
    if (record.personalNumber) {
        ids.personalNumber = record.personalNumber;
    }
    if (record.identityCard) {
        ids.identityCard = record.identityCard;
    }
    if (record.goalUserId) {
        ids.goalUserId = record.goalUserId;
    }
    return ids;
}
function getFirstIdentifier(ids: identifiers) {
    return ids.identityCard || ids.personalNumber || ids.goalUserId;
}
export function findAndUpdateRecord(
    sourceMergedRecords: MatchedRecord[] | null | undefined,
    matchedRecord: MatchedRecord,
    compareRecords: (record1, record2) => boolean,
): [MatchedRecord[], boolean] {
    let updated: boolean = false;
    if (sourceMergedRecords && sourceMergedRecords.length) {
        // find all the records that are "the same" record, should be at most 1 anyway in cases of comparing by userID
        const matchingSourceMergedRecords = sourceMergedRecords.filter((recordIter) => {
            return compareRecords(recordIter.record, matchedRecord.record);
        });
        // if record found in the merged records, then we check for updates and update necessarily
        if (matchingSourceMergedRecords.length) {
            // check for update/diff
            for (let i = 0; i < sourceMergedRecords.length; i += 1) {
                const mergedRecordIter = sourceMergedRecords[i];
                if (compareRecords(sourceMergedRecords[i].record, matchedRecord.record)) {
                    // if (JSON.stringify(mergedRecordIter.record) !== JSON.stringify(matchedRecord.record)) {
                    const diffResult = difference(mergedRecordIter.record, matchedRecord.record);
                    const diffResult2 = difference(matchedRecord.record, mergedRecordIter.record);
                    if ((diffResult && Object.keys(diffResult).length !== 0) || (diffResult2 && Object.keys(diffResult2).length !== 0)) {
                        sourceMergedRecords[i] = matchedRecord;
                        sourceMergedRecords[i].updatedAt = new Date();
                        updated = true;
                        logger.info(
                            false,
                            logFields.scopes.app as scopeOption,
                            'Updated current record of person',
                            `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
                            {
                                id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                                uniqueId: matchedRecord.record.userID,
                                source: matchedRecord.dataSource,
                            },
                        );
                    }
                }
            }
        } else {
            // if it wasnt already in the merged records then we add it to there
            matchedRecord.updatedAt = new Date();
            sourceMergedRecords.push(matchedRecord);
            updated = true;
            logger.info(
                false,
                logFields.scopes.app as scopeOption,
                'Added new source to person (source array existed)',
                // eslint-disable-next-line no-useless-concat
                `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
                {
                    id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                    uniqueId: matchedRecord.record.userID,
                    source: matchedRecord.dataSource,
                },
            );
        }
    } else {
        // if the person has no array of merged records for this datasource, then we add it along with the matched record.
        // eslint-disable-next-line no-param-reassign
        sourceMergedRecords = [matchedRecord]; // does it change the original? probably not
        sourceMergedRecords[0].updatedAt = new Date();
        updated = true;
        logger.info(
            false,
            logFields.scopes.app as scopeOption,
            'Added new source to person (source array didnt exist)',
            // eslint-disable-next-line no-useless-concat
            `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
            {
                id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                uniqueId: matchedRecord.record.userID,
                source: matchedRecord.dataSource,
            },
        );
    }
    sourceMergedRecords[0].lastPing = new Date();
    return [sourceMergedRecords, updated];
}

// eslint-disable-next-line import/prefer-default-export
export const initializeMongo = async () => {
    await mongoose.connect(mongo.uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });
};

export async function matchedRecordHandler(matchedRecord: MatchedRecord) {
    const identifiers: any[] = [];
    if (matchedRecord.record.personalNumber) {
        identifiers.push({ 'identifiers.personalNumber': matchedRecord.record.personalNumber });
    }
    if (matchedRecord.record.identityCard) {
        identifiers.push({ 'identifiers.identityCard': matchedRecord.record.identityCard });
    }
    if (matchedRecord.record.goalUserId) {
        identifiers.push({ 'identifiers.goalUserId': matchedRecord.record.goalUserId });
    }
    // find in mongo
    const foundIdentifiers: any[] = [];
    const mergedObjects: MergedOBJ[] = await personsDB
        .find({
            $or: identifiers,
        })
        .lean();
    // eslint-disable-next-line no-restricted-syntax
    for (const record of mergedObjects) {
        if (record.identifiers.personalNumber) foundIdentifiers.push({ 'identifiers.personalNumber': record.identifiers.personalNumber });
        if (record.identifiers.identityCard) foundIdentifiers.push({ 'identifiers.identityCard': record.identifiers.identityCard });
        if (record.identifiers.goalUserId) foundIdentifiers.push({ 'identifiers.goalUserId': record.identifiers.goalUserId });
    }
    // eslint-disable-next-line prefer-spread
    const maxLock = Math.max.apply(
        Math,
        // eslint-disable-next-line func-names
        mergedObjects.map(function (o: MergedOBJ) {
            return o.lock;
        }),
    );
    if (mergedObjects && mergedObjects.length >= 1) {
        // if there was multiple "people" in the merged db that belong to the same person, the we unify them into one mergedObj
        // by default merge into the first one in the array
        if (mergedObjects.length > 1) {
            for (let i = 1; i < mergedObjects.length; i += 1) {
                logger.info(
                    true,
                    logFields.scopes.app as scopeOption,
                    'Unifying existing records',
                    `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
                    {
                        id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                        uniqueId: matchedRecord.record.userID,
                        source: matchedRecord.dataSource,
                    },
                );
                Object.keys(fn.dataSources).forEach((x) => {
                    if (mergedObjects[0][x] !== undefined) {
                        if (mergedObjects[i][x] !== undefined) mergedObjects[0][x] = [...mergedObjects[0][x], ...mergedObjects[i][x]];
                    } else mergedObjects[0][x] = mergedObjects[i][x];
                });

                mergedObjects[0].identifiers.personalNumber = mergedObjects[0].identifiers.personalNumber
                    ? mergedObjects[0].identifiers.personalNumber
                    : mergedObjects[i].identifiers.personalNumber;

                mergedObjects[0].identifiers.identityCard = mergedObjects[0].identifiers.identityCard
                    ? mergedObjects[0].identifiers.identityCard
                    : mergedObjects[i].identifiers.identityCard;

                mergedObjects[0].identifiers.goalUserId = mergedObjects[0].identifiers.goalUserId
                    ? mergedObjects[0].identifiers.goalUserId
                    : mergedObjects[i].identifiers.goalUserId;
            }
            mergedObjects[0].updatedAt = new Date();
        }
        const mergedRecord: MergedOBJ = mergedObjects[0];
        const recordDataSource: string = matchedRecord.dataSource;
        const dataSourceRevert: string = fn.dataSourcesRevert[recordDataSource];
        let updated: boolean = false;
        switch (recordDataSource) {
            case fn.dataSources.aka: {
                [mergedRecord.aka, updated] = findAndUpdateRecord(mergedRecord.aka, matchedRecord, compareFunctions.akaCompare);
                break;
            }
            case fn.dataSources.city: {
                if (mergedRecord.mir) {
                    for (let i = 0; i < mergedRecord.mir.length; i += 1) {
                        if (mergedRecord.mir[i].record.userID === matchedRecord.record.userID) {
                            mergedRecord.mir.splice(i, 1);
                            logger.info(
                                false,
                                logFields.scopes.app as scopeOption,
                                `Removed Datasource ${fn.dataSources.mir} after adding Datasource ${fn.dataSources.city}`,
                                `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${
                                    matchedRecord.dataSource
                                }, uniqueID: ${matchedRecord.record.userID}`,
                                {
                                    id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                                    uniqueId: matchedRecord.record.userID,
                                    source: matchedRecord.dataSource,
                                },
                            );
                        }
                    }
                }
                [mergedRecord[dataSourceRevert], updated] = findAndUpdateRecord(
                    mergedRecord[dataSourceRevert],
                    matchedRecord,
                    compareFunctions.userIDCompare,
                );
                break;
            }
            case fn.dataSources.mir: {
                if (mergedRecord.city) {
                    for (let i = 0; i < mergedRecord.city.length; i += 1) {
                        if (mergedRecord.city[i].record.userID === matchedRecord.record.userID) {
                            mergedRecord.city.splice(i, 1);
                            logger.info(
                                false,
                                logFields.scopes.app as scopeOption,
                                `Removed Datasource ${fn.dataSources.city} after adding Datasource ${fn.dataSources.mir}`,
                                `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${
                                    matchedRecord.dataSource
                                }, uniqueID: ${matchedRecord.record.userID}`,
                                {
                                    id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                                    uniqueId: matchedRecord.record.userID,
                                    source: matchedRecord.dataSource,
                                },
                            );
                        }
                    }
                }
                [mergedRecord[dataSourceRevert], updated] = findAndUpdateRecord(
                    mergedRecord[dataSourceRevert],
                    matchedRecord,
                    compareFunctions.userIDCompare,
                );
                break;
            }
            default: {
                [mergedRecord[dataSourceRevert], updated] = findAndUpdateRecord(
                    mergedRecord[dataSourceRevert],
                    matchedRecord,
                    compareFunctions.userIDCompare,
                );
            }
        }
        mergedRecord.identifiers.personalNumber = mergedRecord.identifiers.personalNumber
            ? mergedRecord.identifiers.personalNumber
            : matchedRecord.record.personalNumber;
        if (!mergedRecord.identifiers.personalNumber) delete mergedRecord.identifiers.personalNumber;
        mergedRecord.identifiers.identityCard = mergedRecord.identifiers.identityCard
            ? mergedRecord.identifiers.identityCard
            : matchedRecord.record.identityCard;
        if (!mergedRecord.identifiers.identityCard) delete mergedRecord.identifiers.identityCard;
        mergedRecord.identifiers.goalUserId = mergedRecord.identifiers.goalUserId
            ? mergedRecord.identifiers.goalUserId
            : matchedRecord.record.goalUserId;
        if (!mergedRecord.identifiers.goalUserId) delete mergedRecord.identifiers.goalUserId;
        if (updated) mergedRecord.updatedAt = new Date();
        mergedRecord.lock = maxLock + 1;
        const insertSession = personsDB.startSession();
        try {
            await (
                await insertSession
            ).withTransaction(async () => {
                await personsDB.collection.deleteMany({ $and: [{ $or: foundIdentifiers }, { lock: { $lte: mergedRecord.lock } }] });
                await personsDB.collection.insertOne(mergedRecord);
                await (await insertSession).commitTransaction();
            });
        } finally {
            await (await insertSession).endSession();
        }
        if (updated) await menash.send(config.rabbit.afterMerge, mergedRecord); // send only if updated
    } else {
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
            // eslint-disable-next-line no-useless-concat
            `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
            {
                id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                uniqueId: matchedRecord.record.userID,
                source: matchedRecord.dataSource,
            },
        );
        // save newMergeRecord in DB
        await personsDB.collection.insertOne(mergedRecord);
        await menash.send(config.rabbit.afterMerge, mergedRecord);
    }
}
export async function featureConsumeFunction(msg: ConsumerMessage) {
    const matchedRecord: MatchedRecord = msg.getContent() as MatchedRecord;
    // eslint-disable-next-line no-constant-condition
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
