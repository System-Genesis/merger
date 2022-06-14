import logger, { scopeOption } from 'logger-genesis';
import { getIdentifiers, getFirstIdentifier } from './identifiersUtils';
import { MergedOBJ, MatchedRecord } from '../types/types';

const fn = require('../config/fieldNames');

const { logFields } = fn;

function mergeAllMergedObj(mergedObjects: MergedOBJ[], matchedRecord: MatchedRecord) {
    if (mergedObjects.length > 1) {
        for (let i = 1; i < mergedObjects.length; i += 1) {
            const firstMerge = mergedObjects[0];
            const currMerge = mergedObjects[i];
            logger.info(
                true,
                logFields.scopes.app as scopeOption,
                'Unifying existing records',
                `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
                {
                    id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                    uniqueId: matchedRecord.record.userID,
                    source: matchedRecord.dataSource,
                },
            );

            Object.keys(fn.dataSources).forEach((x) => {
                if (firstMerge[x] !== undefined) {
                    if (currMerge[x] !== undefined) firstMerge[x] = [...firstMerge[x], ...currMerge[x]];
                } else firstMerge[x] = currMerge[x];
            });

            firstMerge.identifiers.personalNumber = firstMerge.identifiers.personalNumber || currMerge.identifiers.personalNumber;

            firstMerge.identifiers.identityCard = firstMerge.identifiers.identityCard || currMerge.identifiers.identityCard;

            firstMerge.identifiers.goalUserId = firstMerge.identifiers.goalUserId || currMerge.identifiers.goalUserId;
        }

        // eslint-disable-next-line no-param-reassign
        mergedObjects[0].updatedAt = new Date();
    }
}

export default mergeAllMergedObj;
