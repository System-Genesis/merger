import { MatchedRecord, MergedOBJ } from '../types/types';
import fn from '../config/fieldNames';
import * as logs from '../logger/logs';

export function handleSourcesConflict(source: string, mergedRecord: MergedOBJ, newRecord: MatchedRecord) {
    if (source == fn.dataSources.city && mergedRecord.mir) {
        deleteSameRecordFromAnotherSource(mergedRecord, newRecord, fn.dataSources.mir, fn.dataSources.city);
    } else if (source == fn.dataSources.mir && mergedRecord.city) {
        deleteSameRecordFromAnotherSource(mergedRecord, newRecord, fn.dataSources.city, fn.dataSources.mir);
    }
}

export function deleteSameRecordFromAnotherSource(mergedRecord: MergedOBJ, newRecord: MatchedRecord, delSource: string, newSource: string) {
    const delSourceReverted: string = fn.dataSourcesRevert[delSource];
    const newSourceReverted: string = fn.dataSourcesRevert[newSource];

    for (let i = 0; i < mergedRecord[delSourceReverted].length; i += 1) {
        if (mergedRecord[delSourceReverted][i].record.userID === newRecord.record.userID) {
            mergedRecord[delSourceReverted].splice(i, 1);
            logs.deleteRecordFromSource(delSourceReverted, newSourceReverted, newRecord);
        }
    }

    if (mergedRecord[delSourceReverted].length == 0) delete mergedRecord[delSourceReverted];
}
