import { CompareRecordsFunc } from './../types/types';
import { basicMatchType } from '../types/types';

export function getMatchFunc(source: string): CompareRecordsFunc {
    return source != 'aka' ? userIDCompare : akaCompare;
}

export function akaCompare(record1: basicMatchType, record2: basicMatchType): boolean {
    return record1.identityCard === record2.identityCard && record1.personalNumber === record2.personalNumber;
}

export function userIDCompare(record1: basicMatchType, record2: basicMatchType): boolean {
    return record1.userID === record2.userID;
}
