import { basicMatchType, queryMongo, identifiersType } from './types';

/**
 *
 * @param record the record that we want to get available identifiers from
 * @returns the available identifiers in the record
 */
export function getIdentifiers(record: identifiersType) {
    const ids: identifiersType = {};
    if (record.personalNumber) {
        ids.personalNumber = record.personalNumber;
    }
    if (record.identityCard) {
        ids.identityCard = record.identityCard;
    }
    if (record.goalUserId) {
        ids.goalUserId = record.goalUserId;
    }
    return ids;
}
/**
 *
 * @param ids takes in an object of identifiers (one of each kind), usually used on the "getIdentifiers" function
 * @returns returns a valid identifier, giving priority first to id then to pn then to uid
 */
export function getFirstIdentifier(ids: identifiersType) {
    return ids.identityCard || ids.personalNumber || ids.goalUserId;
}
/**
 * get all identifiers and prepare for $or in mongo
 * @param record with identifier
 * @returns [ { 'identifiers.personalNumber': 4578456 }, { 'identifiers.identityCard': 124578452 }, { 'identifiers.goalUserId': 'a@a.a'}]
 */
export function prepareMongoQueryByIds(record: basicMatchType) {
    // prepare to mongo GET QUERY
    const identifiers: queryMongo = [];
    if (record.personalNumber) identifiers.push({ 'identifiers.personalNumber': record.personalNumber });

    if (record.identityCard) identifiers.push({ 'identifiers.identityCard': record.identityCard });

    if (record.goalUserId) identifiers.push({ 'identifiers.goalUserId': record.goalUserId });

    return identifiers;
}
