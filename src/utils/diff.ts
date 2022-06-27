import { MatchedRecord } from '../types/types';

export function diff(mergedRecordIter: MatchedRecord, newRecord: MatchedRecord) {
    if (Object.keys(mergedRecordIter.record).length !== Object.keys(newRecord.record).length) {
        return true;
    }

    for (const key of Object.keys(mergedRecordIter.record)) {
        const mergeVal = mergedRecordIter.record[key];
        const newVal = newRecord.record[key];
        if (mergeVal == newVal) {
            continue;
        } else {
            if (Array.isArray(mergeVal)) {
                if (!Array.isArray(newVal)) {
                    return true;
                } else {
                    if (mergeVal.length !== newVal.length) {
                        return true;
                    }

                    for (const val of mergeVal) {
                        if (!newVal.includes(val)) {
                            return true;
                        }
                    }
                }
            } else {
                return true;
            }
        }
    }

    return false;
}
