/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
import * as mongoose from 'mongoose';
import { ConsumerMessage, menash } from 'menashmq';
import config from '../config';
import * as compareFunctions from './recordCompareFunctions';
import personsDB from './models';

const { mongo, rabbit } = config;
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
    adnn: MatchedRecord[];
    city: MatchedRecord[];
    nv: MatchedRecord[];
    sf: MatchedRecord[];
    identifiers: { personalNumber: string; identityCard: string; goalUserId: string };
}

export function findAndUpdateRecord(
    sourceMergedRecords: MatchedRecord[],
    matchedRecord: MatchedRecord,
    compareRecords: (record1, record2) => boolean,
): MatchedRecord[] {
    if (sourceMergedRecords && sourceMergedRecords.length) {
        // find all the records that are "the same" record, should be at most 1 anyway in cases of comparing by userID
        sourceMergedRecords.filter((recordIter) => {
            return compareRecords(recordIter, matchedRecord);
        });
        // if record found in the merged records, then we check for updates and update necessarily
        if (sourceMergedRecords.length) {
            // check for update/diff
            for (let i = 0; i < sourceMergedRecords.length; i += 1) {
                const mergedRecordIter = sourceMergedRecords[i];
                if (JSON.stringify(mergedRecordIter.record) !== JSON.stringify(matchedRecord.record)) {
                    sourceMergedRecords[i] = matchedRecord;
                    sourceMergedRecords[i].updatedAt = new Date();
                }
            }
        } else {
            // if it wasnt already in the merged records then we add it to there
            sourceMergedRecords.push(matchedRecord);
            sourceMergedRecords[0].updatedAt = new Date();
        }
    } else {
        // if the person has no array of merged records for this datasource, then we add it along with the matched record.
        // eslint-disable-next-line no-param-reassign
        sourceMergedRecords = [matchedRecord]; // does it change the original? probably not
        sourceMergedRecords[0].updatedAt = new Date();
    }
    sourceMergedRecords[0].lastPing = new Date();
    return sourceMergedRecords;
}

export const findInMongo = async (matchedRecord: MatchedRecord): Promise<MergedOBJ[]> => {
    const mergedPersonsInDB: MergedOBJ[] = await personsDB
        .find({
            $or: [
                { 'identifiers.personalNumber': matchedRecord.record.personalNumber },
                { 'identifiers.identityCard': matchedRecord.record.identityCard },
            ],
        })
        .exec();
    return mergedPersonsInDB;
};

// eslint-disable-next-line import/prefer-default-export
export const initializeMongo = async () => {
    // eslint-disable-next-line no-console
    console.log('Connecting to Mongo...');

    await mongoose.connect(mongo.uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });

    // eslint-disable-next-line no-console
    console.log('Mongo connection established');
};

export async function matchedRecordHandler(matchedRecord: MatchedRecord) {
    // eslint-disable-next-line no-console
    console.log('Received message: ', matchedRecord);
    const mergedRecords: MergedOBJ[] = await findInMongo(matchedRecord);
    // eslint-disable-next-line func-names
    if (mergedRecords && mergedRecords.length >= 1) {
        // if there was multiple "people" in the merged db that belong to the same person, the we unify them into one mergedObj
        // by default merge into the first one in the array
        if (mergedRecords.length > 1) {
            for (let i = 1; i < mergedRecords.length; i += 1) {
                if (mergedRecords[0].aka) mergedRecords[0].aka = mergedRecords[0].aka.concat(mergedRecords[i].aka);
                if (mergedRecords[0].ads) mergedRecords[0].ads = mergedRecords[0].ads.concat(mergedRecords[i].ads);
                if (mergedRecords[0].es) mergedRecords[0].es = mergedRecords[0].es.concat(mergedRecords[i].es);

                mergedRecords[0].identifiers.personalNumber = mergedRecords[0].identifiers.personalNumber
                    ? mergedRecords[0].identifiers.personalNumber
                    : mergedRecords[i].identifiers.personalNumber;

                mergedRecords[0].identifiers.identityCard = mergedRecords[0].identifiers.identityCard
                    ? mergedRecords[0].identifiers.identityCard
                    : mergedRecords[i].identifiers.identityCard;

                mergedRecords[0].identifiers.goalUserId = mergedRecords[0].identifiers.goalUserId
                    ? mergedRecords[0].identifiers.goalUserId
                    : mergedRecords[i].identifiers.goalUserId;
            }
        }
        await personsDB.deleteMany({
            $or: [
                { 'identifiers.personalNumber': matchedRecord.record.personalNumber },
                { 'identifiers.identityCard': matchedRecord.record.identityCard },
                { 'identifiers.goalUserId': matchedRecord.record.goalUserId },
            ],
        });

        const mergedRecord: MergedOBJ = mergedRecords[0];
        const recordDataSource: string = matchedRecord.dataSource;
        switch (recordDataSource) {
            case 'aka': {
                mergedRecord.aka = findAndUpdateRecord(mergedRecord.aka, matchedRecord.record, compareFunctions.akaCompare);
                break;
            }
            case 'ads': {
                mergedRecord.ads = findAndUpdateRecord(mergedRecord.ads, matchedRecord.record, compareFunctions.userIDCompare);
                break;
            }
            case 'es_name': {
                mergedRecord.es = findAndUpdateRecord(mergedRecord.es, matchedRecord.record, compareFunctions.userIDCompare);
                break;
            }
            default:
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

        await personsDB.collection.insertOne(mergedRecord);
        await menash.send(rabbit.afterMerge, mergedRecord);
    } else {
        const mergedRecord = <MergedOBJ>{};
        const recordDataSource: string = matchedRecord.dataSource;
        switch (recordDataSource) {
            case 'aka': {
                mergedRecord.aka = [matchedRecord];
                break;
            }
            case 'ads': {
                mergedRecord.ads = [matchedRecord];
                break;
            }
            case 'es_name': {
                mergedRecord.es = [matchedRecord];
                break;
            }
            default:
        }
        // mergedRecord.identifiers = { personalNumber: '', identityCard: '', goalUserId: '' };
        mergedRecord.identifiers = {
            personalNumber: matchedRecord.record.personalNumber,
            identityCard: matchedRecord.record.identityCard,
            goalUserId: matchedRecord.record.goalUserId,
        };
        // save newMergeRecord in DB
        await personsDB.collection.insertOne(mergedRecord);
        await menash.send(rabbit.afterMerge, mergedRecord);
    }
    // if there was multiple "people" in the merged db that belong to the same person, the we unify them into one mergedObj
    // by default merge into the first one in the array
}
export async function featureConsumeFunction(msg: ConsumerMessage) {
    const matchedRecord: MatchedRecord = msg.getContent() as MatchedRecord;
    await matchedRecordHandler(matchedRecord);
    msg.ack();
}
