import fn from '../config/fieldNames';
import { MatchedRecord, MergedOBJ } from '../types/types';
import { getIdentifiers } from './identifiersUtils';
import { sendToQueue } from '../rabbit/init';
import { insertOne } from '../mongo/repo';
import * as logs from '../logger/logs';

export async function addNewEntity(matchedRecord: MatchedRecord) {
    const mergedRecord = <MergedOBJ>{};
    const recordDataSource: string = matchedRecord.dataSource;

    if (fn.dataSourcesRevert[recordDataSource] === undefined) {
        // error that not right source
        // TODO add log
    }

    matchedRecord.updatedAt = new Date();
    matchedRecord.lastPing = new Date();

    mergedRecord[fn.dataSourcesRevert[recordDataSource]] = [matchedRecord];
    mergedRecord.identifiers = getIdentifiers(matchedRecord.record);
    mergedRecord.updatedAt = new Date();
    mergedRecord.lock = 0;

    // save newMergeRecord in DB
    await insertOne(mergedRecord);

    // send to next service queue
    await sendToQueue(mergedRecord);

    logs.addNewEntity(matchedRecord);
}
