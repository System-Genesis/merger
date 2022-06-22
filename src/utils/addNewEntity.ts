import fn from '../config/fieldNames';
import { MatchedRecord, MergedOBJ } from '../types/types';
import { getIdentifiers } from './identifiersUtils';
import { sendToQueue } from '../rabbit/init';
import { insertOne } from '../mongo/repo';
import * as logs from '../logger/logs';

export async function addNewEntity(newRecord: MatchedRecord) {
    const recordDataSource: string = newRecord.dataSource;

    if (fn.dataSourcesRevert[recordDataSource] === undefined) {
        throw Error(`${recordDataSource} not recognize in merger dataSourcesRevert:${fn.dataSourcesRevert[recordDataSource]}`);
    }
    const now = new Date();

    const mergedRecord: MergedOBJ = {
        [fn.dataSourcesRevert[recordDataSource]]: [{ ...newRecord, updatedAt: now, lastPing: now }],
        identifiers: getIdentifiers(newRecord.record),
        updatedAt: now,
        lock: 0,
    };

    // save newMergeRecord in DB
    await insertOne(mergedRecord);

    // send to next service queue
    await sendToQueue(mergedRecord);

    logs.addNewEntity(newRecord);
}
