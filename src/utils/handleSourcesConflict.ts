import { MatchedRecord, MergedOBJ } from '../types/types';
import fn from '../config/fieldNames';
import * as logs from '../logger/logs';

export function handleSourcesConflict(source: string, mergedRecord: MergedOBJ, newRecord: MatchedRecord) {
    if (source == fn.dataSources.city && mergedRecord.mir) {
        deleteSameRecordFromAnotherSource(mergedRecord, newRecord, fn.dataSources.city, fn.dataSources.mir);
    } else if (source == fn.dataSources.mir && mergedRecord.city) {
        deleteSameRecordFromAnotherSource(mergedRecord, newRecord, fn.dataSources.mir, fn.dataSources.city);
    }
}

export function deleteSameRecordFromAnotherSource(mergedRecord: MergedOBJ, newRecord: MatchedRecord, delSource: string, newSource: string) {
    for (let i = 0; i < mergedRecord[delSource].length; i += 1) {
        if (mergedRecord[delSource][i].record.userID === newRecord.record.userID) {
            mergedRecord[delSource].splice(i, 1);
            logs.deleteRecordFromSource(delSource, newSource, newRecord);
        }
    }

    if (mergedRecord[delSource].length == 0) delete mergedRecord[delSource]; // TODO check if right ADDED
}
