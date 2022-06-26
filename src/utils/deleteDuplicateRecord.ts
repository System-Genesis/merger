import { CompareRecordsFunc, MatchedRecord } from '../types/types';

export function deleteDuplicateRecord(sourceMergedRecords: MatchedRecord[], compareRecords: CompareRecordsFunc, matchedRecord: MatchedRecord) {
    let mergedRecordLeft: MatchedRecord | undefined;

    for (let i = 0; i < sourceMergedRecords.length; i++) {
        if (compareRecords(sourceMergedRecords[i].record, matchedRecord.record)) {
            mergedRecordLeft = sourceMergedRecords.splice(i, 1)[0];
            i--;
        }
    }

    if (mergedRecordLeft) sourceMergedRecords.push(mergedRecordLeft);
}
