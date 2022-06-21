import { CompareRecordsFunc, MatchedRecord } from '../types/types';
import * as logs from '../logger/logs';
import { deleteDuplicateRecord } from './deleteDuplicateRecord';
import { diff } from './diff';

/**
 * takes in matched record and checks if it is in sourceMergedRecords, if it is, it then checks if the matching record in sourceMergedRecords needs to be updated,
 * if so then updates it and updates last ping and updatedAt, otherwise does nothing
 * if the record didnt exist in sourceMergedRecords already (not even an outdated version), then the function inserts the matchedRecord
 * into the sourceMergedRecords and updates last ping and updatedAt
 * @param sourceMergedRecords all the records of the same source to a certain person (whats currently in mongodb)
 * @param newRecord the record we want to insert into the sourceMergedRecords
 * @param compareRecords a function that can compare between each record in sourceMergedRecords and matched record to see if they are the same record
 * @returns
 */
export function findAndUpdateRecord(
    sourceMergedRecords: MatchedRecord[] | null | undefined,
    newRecord: MatchedRecord,
    compareRecords: CompareRecordsFunc,
): [MatchedRecord[], boolean] {
    let updated: boolean = false;

    if (!sourceMergedRecords?.length) {
        const now = new Date();
        // if the person has no array of merged records for this datasource, then we add it along with the matched record.
        sourceMergedRecords = [{ ...newRecord, updatedAt: now, lastPing: now }];

        updated = true;
        logs.addSourceToEntity(newRecord);
    } else {
        // find all the records that are "the same" record, should be at most 1 anyway in cases of comparing by userID
        const matchingSourceMergedRecords = sourceMergedRecords.filter((recordIter) => {
            return compareRecords(recordIter.record, newRecord.record);
        });

        // if record found in the merged records, then we check for updates and update necessarily
        if (!matchingSourceMergedRecords.length) {
            // add record to exits source
            const now = new Date();

            sourceMergedRecords.push({ ...newRecord, updatedAt: now, lastPing: now });
            logs.addRecordToEntity(newRecord);
            updated = true;
        } else {
            // check for update/diff
            for (let i = 0; i < sourceMergedRecords.length; i++) {
                if (compareRecords(sourceMergedRecords[i].record, newRecord.record)) {
                    if (diff(sourceMergedRecords[i], newRecord)) {
                        // overwrite record
                        const now = new Date();

                        sourceMergedRecords[i] = { ...newRecord, updatedAt: now, lastPing: now };

                        logs.overwriteRecord(newRecord);
                        updated = true;
                    }
                }
            }

            if (matchingSourceMergedRecords.length > 1) {
                // all pass overwriteRecord
                // delete all duplicates
                deleteDuplicateRecord(sourceMergedRecords, compareRecords, newRecord);
            }
        }
    }

    // TODO: why is only first object get the last ping
    sourceMergedRecords[0].lastPing = new Date();
    return [sourceMergedRecords, updated];
}
