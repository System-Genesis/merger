/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
import * as mongoose from 'mongoose';
import { ConsumerMessage } from 'menashmq';
// import diff from 'jest-diff';
// import { merge } from 'lodash';
import config from '../config';
import * as compareFunctions from './recordCompareFunctions';
import personsDB from './models';
import { difference } from './difference';

const dotenv = require('dotenv');

dotenv.config();
const fn = require('../config/fieldNames');

const { mongo } = config;
export interface MatchedRecord {
    record: any;
    dataSource: string;
    timeStamp: string;
    updatedAt?: Date;
    lastPing?: Date;
}

interface MergedOBJ {
    aka: MatchedRecord[];
    ads: MatchedRecord[];
    es: MatchedRecord[];
    sf: MatchedRecord[];
    adnn: MatchedRecord[];
    city: MatchedRecord[];
    nv: MatchedRecord[];
    mir: MatchedRecord[];
    lmn: MatchedRecord[];
    mdn: MatchedRecord[];
    identifiers: { personalNumber: string; identityCard: string; goalUserId: string };
    updatedAt: Date;
}
export function findAndUpdateRecord(
    sourceMergedRecords: MatchedRecord[],
    matchedRecord: MatchedRecord,
    compareRecords: (record1, record2) => boolean,
): [MatchedRecord[], boolean] {
    let updated: boolean = false;
    if (sourceMergedRecords && sourceMergedRecords.length) {
        // find all the records that are "the same" record, should be at most 1 anyway in cases of comparing by userID
        const matchingSourceMergedRecords = sourceMergedRecords.filter((recordIter) => {
            return compareRecords(recordIter, matchedRecord);
        });
        // if record found in the merged records, then we check for updates and update necessarily
        if (matchingSourceMergedRecords.length) {
            // check for update/diff
            for (let i = 0; i < sourceMergedRecords.length; i += 1) {
                const mergedRecordIter = sourceMergedRecords[i];
                if (compareRecords(sourceMergedRecords[i], matchedRecord)) {
                    // if (JSON.stringify(mergedRecordIter.record) !== JSON.stringify(matchedRecord.record)) {
                    const diffResult = difference(mergedRecordIter.record, matchedRecord.record);
                    if (diffResult && Object.keys(diffResult).length !== 0) {
                        sourceMergedRecords[i] = matchedRecord;
                        sourceMergedRecords[i].updatedAt = new Date();
                        updated = true;
                    }
                }
            }
        } else {
            // if it wasnt already in the merged records then we add it to there
            matchedRecord.updatedAt = new Date();
            sourceMergedRecords.push(matchedRecord);
            updated = true;
        }
    } else {
        // if the person has no array of merged records for this datasource, then we add it along with the matched record.
        // eslint-disable-next-line no-param-reassign
        sourceMergedRecords = [matchedRecord]; // does it change the original? probably not
        sourceMergedRecords[0].updatedAt = new Date();
        updated = true;
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
    const mergedObjects: MergedOBJ[] = await personsDB.collection
        .find({
            $or: identifiers,
        })
        .toArray();

    if (mergedObjects && mergedObjects.length >= 1) {
        // if there was multiple "people" in the merged db that belong to the same person, the we unify them into one mergedObj
        // by default merge into the first one in the array
        if (mergedObjects.length > 1) {
            for (let i = 1; i < mergedObjects.length; i += 1) {
                ['aka', 'ads', 'sf', 'es', 'adnn', 'city', 'nv', 'mir', 'lmn', 'mdn'].forEach((x) => {
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
        }
        await personsDB.deleteMany({
            $or: identifiers,
        });
        const mergedRecord: MergedOBJ = mergedObjects[0];
        const recordDataSource: string = matchedRecord.dataSource;
        const dataSourceRevert: string = fn.dataSourcesRevert[recordDataSource];
        let updated: boolean = false;
        switch (recordDataSource) {
            case 'aka': {
                [mergedRecord.aka, updated] = findAndUpdateRecord(mergedRecord.aka, matchedRecord, compareFunctions.akaCompare);
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
        mergedRecord.identifiers.identityCard = mergedRecord.identifiers.identityCard
            ? mergedRecord.identifiers.identityCard
            : matchedRecord.record.identityCard;
        mergedRecord.identifiers.goalUserId = mergedRecord.identifiers.goalUserId
            ? mergedRecord.identifiers.goalUserId
            : matchedRecord.record.goalUserId;
        if (updated) mergedRecord.updatedAt = new Date();

        await personsDB.collection.insertOne(mergedRecord);
        // if (updated) await menash.send(rabbit.afterMerge, mergedRecord); // send only if updated
    } else {
        const mergedRecord = <MergedOBJ>{};
        const recordDataSource: string = matchedRecord.dataSource;
        if (fn.dataSourcesRevert[recordDataSource] === undefined) {
            // error that not right source
        }
        mergedRecord[fn.dataSourcesRevert[recordDataSource]] = [matchedRecord];
        // mergedRecord.identifiers = { personalNumber: '', identityCard: '', goalUserId: '' };
        mergedRecord.identifiers = {
            personalNumber: matchedRecord.record.personalNumber,
            identityCard: matchedRecord.record.identityCard,
            goalUserId: matchedRecord.record.goalUserId,
        };
        // save newMergeRecord in DB
        await personsDB.collection.insertOne(mergedRecord);
        // await menash.send(rabbit.afterMerge, mergedRecord);
    }
}
export async function featureConsumeFunction(msg: ConsumerMessage) {
    const matchedRecord: MatchedRecord = msg.getContent() as MatchedRecord;
    await matchedRecordHandler(matchedRecord);
    msg.ack();
}
