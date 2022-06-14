import logger, { scopeOption } from 'logger-genesis';
import { getIdentifiers, getFirstIdentifier } from './identifiersUtils';
import { MatchedRecord } from '../types/types';
import fn from '../config/fieldNames';

const { logFields } = fn;

export function overwriteRecord(sourceMergedRecords: MatchedRecord[], i: number, matchedRecord: MatchedRecord) {
    sourceMergedRecords[i] = { ...matchedRecord, updatedAt: new Date(), lastPing: new Date() };

    logger?.info(
        false,
        logFields.scopes.app as scopeOption,
        `Updated current record of person, Source: ${matchedRecord.dataSource}`,
        `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
        {
            id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
            uniqueId: matchedRecord.record.userID,
            source: matchedRecord.dataSource,
        },
    );
}
