import logger, { scopeOption } from 'logger-genesis';
import fn from '../config/fieldNames';
import { MatchedRecord, MergedOBJ } from '../types/types';
import { getIdentifiers, getFirstIdentifier } from './identifiersUtils';
import { sendToQueue } from '../rabbit/init';
import { insertOne } from './mongo';

const { logFields } = fn;

export async function addNewEntity(matchedRecord: MatchedRecord) {
    const mergedRecord = <MergedOBJ>{};
    const recordDataSource: string = matchedRecord.dataSource;
    if (fn.dataSourcesRevert[recordDataSource] === undefined) {
        // error that not right source
    }
    matchedRecord.updatedAt = new Date();
    mergedRecord[fn.dataSourcesRevert[recordDataSource]] = [matchedRecord];
    mergedRecord.identifiers = {
        ...(!mergedRecord.identifiers ? {} : getIdentifiers(mergedRecord.identifiers)),
        ...getIdentifiers(matchedRecord.record),
    };

    mergedRecord.updatedAt = new Date();

    mergedRecord.lock = 0;
    logger?.info(
        false,
        logFields.scopes.app as scopeOption,
        'Added new person to DB',
        `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
        {
            id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
            uniqueId: matchedRecord.record.userID,
            source: matchedRecord.dataSource,
        },
    );
    // save newMergeRecord in DB
    await insertOne(mergedRecord);
    // send to next service queue
    await sendToQueue(mergedRecord);
}
