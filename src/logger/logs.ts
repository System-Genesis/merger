import logger, { scopeOption } from 'logger-genesis';
import fn from '../config/fieldNames';
import { MatchedRecord, MergedOBJ } from '../types/types';
import { getFirstIdentifier, getIdentifiers } from '../utils/identifiersUtils';

const { logFields } = fn;

export const initRabbit = () => logger.info(false, logFields.scopes.system as scopeOption, 'Initialized Rabbit', 'Initialized Rabbit');
export const initMongo = () => logger.info(false, logFields.scopes.system as scopeOption, 'Initialized Mongo', 'Initialized Mongo');
export const initServer = () => logger.info(false, logFields.scopes.system as scopeOption, 'Initialized Server', 'Start');

export const conflictDB = (e: Error) => logger.error(true, logFields.scopes.app as scopeOption, 'Parallel insert conflict', e.message);

export const failToAddNewEntity = (matchedRecord: MatchedRecord) => {
    logger.error(
        true,
        logFields.scopes.app as scopeOption,
        'Error inserting person',
        `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
        {
            id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
            uniqueId: matchedRecord?.record?.userID,
            source: matchedRecord.dataSource,
        },
    );
};

export const deleteRecordFromSource = (delSource: string, newSource: string, matchedRecord: MatchedRecord) => {
    logger.info(
        true,
        logFields.scopes.app as scopeOption,
        `Removed record for replacement`,
        `Removed from DataSource ${delSource} before adding to DataSource ${newSource}
         identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))},
         Source: ${matchedRecord.dataSource}, uniqueID: ${matchedRecord?.record?.userID}`,
        {
            id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
            uniqueId: matchedRecord?.record?.userID,
            source: matchedRecord.dataSource,
            delSource,
        },
    );
};

export const addSourceToEntity = (matchedRecord: MatchedRecord) => {
    logger.info(
        true,
        logFields.scopes.app as scopeOption,
        'Added new source to person (source array didnt exist)',
        `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
        {
            id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
            uniqueId: matchedRecord?.record?.userID,
            source: matchedRecord.dataSource,
        },
    );
};

export const addRecordToEntity = (matchedRecord: MatchedRecord) => {
    logger.info(
        true,
        logFields.scopes.app as scopeOption,
        `Added new record to person (source array existed)`,
        // eslint-disable-next-line no-useless-concat
        `Added new record in ${matchedRecord.dataSource} 
         identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
        {
            id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
            uniqueId: matchedRecord?.record?.userID,
            source: matchedRecord.dataSource,
        },
    );
};

export const mergeTwoRecordsToSource = (mergeTo: MergedOBJ, source: string) => {
    logger.info(
        true,
        logFields.scopes.app as scopeOption,
        `Merge to OBJ: two records`,
        `source: ${source}, identifiers: ${JSON.stringify(getIdentifiers(mergeTo.identifiers))}`,
        {
            id: getFirstIdentifier(getIdentifiers(mergeTo.identifiers)),
            uniqueId: mergeTo[source]?.record?.userID,
            source: source,
        },
    );
};

export const mergeSourceToObj = (mergeTo: MergedOBJ, source: string) => {
    logger.info(
        true,
        logFields.scopes.app as scopeOption,
        `Merge to OBJ: add source`,
        `identifiers: ${JSON.stringify(getIdentifiers(mergeTo.identifiers))}, Source: ${source}`,
        {
            id: getFirstIdentifier(getIdentifiers(mergeTo.identifiers)),
            uniqueId: mergeTo[source]?.record?.userID,
            source: source,
        },
    );
};

export const addNewEntity = (matchedRecord: MatchedRecord) => {
    logger.info(
        true,
        logFields.scopes.app as scopeOption,
        'Added new person to DB',
        `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
        {
            id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
            uniqueId: matchedRecord?.record?.userID,
            source: matchedRecord.dataSource,
        },
    );
};

export const overwriteRecord = (matchedRecord: MatchedRecord) => {
    logger.info(
        true,
        logFields.scopes.app as scopeOption,
        `Updated current record of person`,
        `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))},
        Source: ${matchedRecord.dataSource},
        userId: ${matchedRecord?.record?.userID}`,
        {
            id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
            uniqueId: matchedRecord?.record?.userID,
            source: matchedRecord.dataSource,
        },
    );
};
