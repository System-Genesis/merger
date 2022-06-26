import { getIdentifiers } from './identifiersUtils';
import { MergedOBJ } from '../types/types';
import * as logs from '../logger/logs';

import fn from '../config/fieldNames';

function mergeAllMergedObj(mergedObjects: MergedOBJ[]) {
    const mergeTo = mergedObjects[0];

    for (let i = 1; i < mergedObjects.length; i += 1) {
        const currMerge = mergedObjects[i];

        mergeTo.identifiers = { ...getIdentifiers(currMerge.identifiers), ...getIdentifiers(mergeTo.identifiers) };

        // run over all sources and add or push existing sources
        Object.keys(fn.dataSources).forEach((source) => {
            // source already exists
            if (mergeTo[source]) {
                // source exists in other obj
                if (currMerge[source]) {
                    mergeTo[source] = [...mergeTo[source], ...currMerge[source]];
                    logs.mergeTwoRecordsToSource(mergeTo, source);
                }
            } else if (currMerge[source]) {
                // source exists only in other obj
                mergeTo[source] = currMerge[source];
                logs.mergeSourceToObj(mergeTo, source);
            }
        });
    }

    mergeTo.updatedAt = new Date();

    return mergeTo;
}

export default mergeAllMergedObj;
