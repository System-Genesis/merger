import * as mongoose from 'mongoose';
import { ConsumerMessage } from 'menashmq';
import config from '../config';
import * as compareFunctions from './recordCompareFunctions';
import personsDB from './models';

const { mongo } = config;

interface MatchedRecord {
    record: any;
    source: string;
    timeStamp: string;
}

interface MergedOBJ {
    aka: MatchedRecord;
    ads: MatchedRecord;
    es: MatchedRecord;
    identifiers: { personalNumber: string; identityCard: string; goalUserId: string };
}

export function findAndUpdateRecord(sourceMergedRecords: any[], matchedRecord: any, compareRecords: (record1, record2) => boolean): any[] {
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
                    // eslint-disable-next-line no-param-reassign
                    sourceMergedRecords[i] = mergedRecordIter;
                }
            }
        } else {
            // if it wasnt already in the merged records then we add it to there
            sourceMergedRecords.push(matchedRecord);
        }
    } else {
        // if the person has no array of merged records for this datasource, then we add it along with the matched record.
        // eslint-disable-next-line no-param-reassign
        sourceMergedRecords = [matchedRecord]; // does it change the original? probably not
    }
    return sourceMergedRecords;
}

export const findInMongo = async (matchedRecord: any): Promise<MergedOBJ[]> => {
    // const db = mongoose.Connection;
    const mergedPersonsInDB = await personsDB
        .find({
            $or: [
                { 'identifiers.personalNumber': matchedRecord.personalNumber },
                { 'identifiers.identityCard': matchedRecord.identityCard },
                { 'identifiers.goalUserId': matchedRecord.goalUserId },
            ],
        })
        .exec();
    // if there was multiple "people" in the merged db that belong to the same person, the we unify them into one mergedObj
    // by default merge into the first one in the array
    return mergedPersonsInDB as unknown as Promise<MergedOBJ[]>;
};

// eslint-disable-next-line import/prefer-default-export
export const initializeMongo = async () => {
    // eslint-disable-next-line no-console
    console.log('Connecting to Mongo...');

    await mongoose.connect(mongo.uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });

    // eslint-disable-next-line no-console
    console.log('Mongo connection established');
};
export function featureConsumeFunction() {
    return async (msg: ConsumerMessage) => {
        // eslint-disable-next-line no-console
        console.log('Received message: ', msg.getContent());

        const matchedRecord: MatchedRecord = msg.getContent() as MatchedRecord;

        const mergedRecords: MergedOBJ[] = await findInMongo(matchedRecord.record);

        // if there was multiple "people" in the merged db that belong to the same person, the we unify them into one mergedObj
        // by default merge into the first one in the array
        if (mergedRecords.length > 1) {
            for (let i = 1; i < mergedRecords.length; i += 1) {
                mergedRecords[0].aka = mergedRecords[0].aka.record.concat(mergedRecords[i].aka);
                mergedRecords[0].ads = mergedRecords[0].ads.record.concat(mergedRecords[i].ads);
                mergedRecords[0].es = mergedRecords[0].es.record.concat(mergedRecords[i].es);
                mergedRecords[0].identifiers.personalNumber = mergedRecords[0].identifiers.personalNumber
                    ? mergedRecords[0].identifiers.personalNumber
                    : mergedRecords[i].identifiers.personalNumber;
                mergedRecords[0].identifiers.identityCard = mergedRecords[0].identifiers.identityCard
                    ? mergedRecords[0].identifiers.identityCard
                    : mergedRecords[i].identifiers.identityCard;
                mergedRecords[0].identifiers.goalUserId = mergedRecords[0].identifiers.goalUserId
                    ? mergedRecords[0].identifiers.goalUserId
                    : mergedRecords[i].identifiers.goalUserId;
                personsDB.remove({
                    $or: [
                        { 'identifiers.personalNumber': matchedRecord.record.personalNumber },
                        { 'identifiers.identityCard': matchedRecord.record.identityCard },
                        { 'identifiers.goalUserId': matchedRecord.record.goalUserId },
                    ],
                });
            }
        }
        const mergedRecord = mergedRecords[0];
        const recordDataSource: string = matchedRecord.source;
        switch (recordDataSource) {
            case 'aka': {
                mergedRecord.aka.record = findAndUpdateRecord(mergedRecord.aka.record, matchedRecord.record, compareFunctions.akaCompare);
                break;
            }
            case 'ads': {
                mergedRecord.ads.record = findAndUpdateRecord(mergedRecord.ads.record, matchedRecord.record, compareFunctions.userIDCompare);
                break;
            }
            case 'es': {
                mergedRecord.es.record = findAndUpdateRecord(mergedRecord.es.record, matchedRecord.record, compareFunctions.userIDCompare);
                break;
            }
            default:
        }
        msg.ack();
    };
}
