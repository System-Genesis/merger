import { MatchedRecord } from '../types/types';

export function diff(mergedRecordIter: MatchedRecord, newRecord: MatchedRecord) {
    if (Object.keys(mergedRecordIter.record).length !== Object.keys(newRecord.record).length) {
        return true;
    }

    for (const key of Object.keys(mergedRecordIter.record)) {
        if (mergedRecordIter.record[key] != newRecord.record[key]) {
            return true;
        }
    }

    return false;
}
