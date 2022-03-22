/* eslint-disable  */
import logger from 'logger-genesis';
// import { difference } from './difference';
import { scopeOption } from './log';
import { getIdentifiers, getFirstIdentifier } from './identifiersUtils';
import { MatchedRecord } from './types';

const fn = require('../config/fieldNames');

const { logFields } = fn;
/**
 * takes in matched record and checks if it is in sourceMergedRecords, if it is, it then checks if the matching record in sourceMergedRecords needs to be updated,
 * if so then updates it and updates last ping and updatedAt, otherwise does nothing
 * if the record didnt exist in sourceMergedRecords already (not even an outdated version), then the function inserts the matchedRecord
 * into the sourceMergedRecords and updates last ping and updatedAt
 * @param sourceMergedRecords all the records of the same source to a certain person (whats currently in mongodb)
 * @param matchedRecord the record we want to insert into the sourceMergedRecords
 * @param compareRecords a function that can compare between each record in sourceMergedRecords and matched record to see if they are the same record
 * @returns
 */
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
                    for (const k of Object.keys(mergedRecordIter.record)) {
                        if (mergedRecordIter.record[k] != matchedRecord.record[k]) {
                            sourceMergedRecords[i] = matchedRecord;
                            sourceMergedRecords[i].updatedAt = new Date();
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
                            break;
                        }
                    }

                    // if (JSON.stringify(mergedRecordIter.record) !== JSON.stringify(matchedRecord.record)) {
                    // const diffResult = difference(mergedRecordIter.record, matchedRecord.record);
                    // const diffResult2 = difference(matchedRecord.record, mergedRecordIter.record);
                    // if ((diffResult && Object.keys(diffResult).length !== 0) || (diffResult2 && Object.keys(diffResult2).length !== 0)) {
                    //     sourceMergedRecords[i] = matchedRecord;
                    //     sourceMergedRecords[i].updatedAt = new Date();
                    //     updated = true;
                    //     logger.info(
                    //         false,
                    //         logFields.scopes.app as scopeOption,
                    //         'Updated current record of person',
                    //         `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
                    //         {
                    //             id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                    //             uniqueId: matchedRecord.record.userID,
                    //             source: matchedRecord.dataSource,
                    //         },
                    //     );
                    // }
                }
            }

            // new record in source
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
        // new source
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
    // TODO: why is only first object get the last ping
    sourceMergedRecords[0].lastPing = new Date();
    return [sourceMergedRecords, updated];
}
