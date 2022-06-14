import logger, { scopeOption } from 'logger-genesis';
import { MatchedRecord, MergedOBJ } from '../types/types';
import { getIdentifiers, getFirstIdentifier } from './identifiersUtils';
import fn from '../config/fieldNames';

const { logFields } = fn;

export function deleteSameRecordFromAnotherSource(mergedRecord: MergedOBJ, matchedRecord: MatchedRecord, delSource: string, newSource: string) {
    for (let i = 0; i < mergedRecord[delSource].length; i += 1) {
        if (mergedRecord[delSource][i].record.userID === matchedRecord.record.userID) {
            mergedRecord[delSource].splice(i, 1);
            logger?.info(
                false,
                logFields.scopes.app as scopeOption,
                `Removed DataSource ${delSource} after adding DataSource ${newSource}`,
                `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}, uniqueID: ${
                    matchedRecord.record.userID
                }`,
                {
                    id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                    uniqueId: matchedRecord.record.userID,
                    source: matchedRecord.dataSource,
                },
            );
        }
    }

    if (mergedRecord[delSource].length == 0) delete mergedRecord[delSource]; // TODO check if right ADDED
}
