import logger, { scopeOption } from 'logger-genesis';
import { getIdentifiers, getFirstIdentifier } from './identifiersUtils';
import { MergedOBJ } from '../types/types';

import fn from '../config/fieldNames';

const { logFields } = fn;

function mergeAllMergedObj(mergedObjects: MergedOBJ[]) {
    if (mergedObjects.length > 1) {
        for (let i = 1; i < mergedObjects.length; i += 1) {
            const mergeTo = mergedObjects[0];
            const currMerge = mergedObjects[i];
            mergeTo.identifiers = { ...getIdentifiers(currMerge.identifiers), ...getIdentifiers(mergeTo.identifiers) };

            // run over all sources and add or push existing sources
            Object.keys(fn.dataSources).forEach((source) => {
                // source already exists
                if (mergeTo[source]) {
                    // source exists in other obj
                    if (currMerge[source]) {
                        mergeTo[source] = [...mergeTo[source], ...currMerge[source]];
                        logMergeTwoRecordsToSource(mergeTo, source);
                    }
                } else if (currMerge[source]) {
                    // source exists only in other obj
                    mergeTo[source] = currMerge[source];
                    logAddRecordToObj(mergeTo, source);
                }
            });
        }

        mergedObjects[0].updatedAt = new Date();
    }
}

function logMergeTwoRecordsToSource(mergeTo: MergedOBJ, source: string) {
    logger?.info(
        true,
        logFields?.scopes?.app as scopeOption,
        `Merge to OBJ: two records to source ${source} identifiers: ${JSON.stringify(getIdentifiers(mergeTo.identifiers))}`,
        `identifiers: ${JSON.stringify(getIdentifiers(mergeTo.identifiers))}, Source: ${source}`,
        {
            id: getFirstIdentifier(getIdentifiers(mergeTo.identifiers)),
            uniqueId: mergeTo[source].record?.userID,
            source: source,
        },
    );
}

function logAddRecordToObj(mergeTo: MergedOBJ, source: string) {
    logger?.info(
        true,
        logFields?.scopes?.app as scopeOption,
        `Merge to OBJ: add source ${source} identifiers: ${JSON.stringify(getIdentifiers(mergeTo.identifiers))}`,
        `identifiers: ${JSON.stringify(getIdentifiers(mergeTo.identifiers))}, Source: ${source}`,
        {
            id: getFirstIdentifier(getIdentifiers(mergeTo.identifiers)),
            uniqueId: mergeTo[source].record?.userID,
            source: source,
        },
    );
}

export default mergeAllMergedObj;
