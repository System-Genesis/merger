import { basicMatchType, queryMongo, identifiersType } from '../types/types';

/**
 *
 * @param record the record that we want to get available identifiers from
 * @returns the available identifiers in the record
 */
export function getIdentifiers(record: identifiersType): identifiersType {
    return {
        ...(record.personalNumber ? { personalNumber: record.personalNumber } : undefined),
        ...(record.identityCard ? { identityCard: record.identityCard } : undefined),
        ...(record.goalUserId ? { goalUserId: record.goalUserId } : undefined),
        ...(record.employeeId ? { employeeId: record.employeeId } : undefined),
    };
}

/**
 *
 * @param ids takes in an object of identifiers (one of each kind), usually used on the "getIdentifiers" function
 * @returns returns a valid identifier, giving priority first to id then to pn then to uid
 */
export function getFirstIdentifier(ids: identifiersType) {
    return ids.identityCard || ids.personalNumber || ids.goalUserId || ids.employeeId;
}
/**
 * get all identifiers and prepare for $or in mongo
 * @param record with identifier
 * @returns [ { 'identifiers.personalNumber': 4578456 }, { 'identifiers.identityCard': 124578452 }, { 'identifiers.goalUserId': 'a@a.a'}]
 */
export function mongoQueryByIds(record: basicMatchType | identifiersType): queryMongo {
    // prepare to mongo GET QUERY
    const identifiers: queryMongo = [];

    if (record.personalNumber) identifiers.push({ 'identifiers.personalNumber': record.personalNumber });

    if (record.identityCard) identifiers.push({ 'identifiers.identityCard': record.identityCard });

    if (record.goalUserId) identifiers.push({ 'identifiers.goalUserId': record.goalUserId });

    if (record.employeeId) identifiers.push({ 'identifiers.employeeId': record.employeeId });

    return identifiers;
}
