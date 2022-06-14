// TODO basicMatch type

export interface basicMatchType {
    personalNumber?: string;
    identityCard?: string;
    goalUserId?: string;
    employeeId?: string;
    userID?: string;
    job: string;
    lastName: string;
    firstName: string;
    entityType: string;
    rank: string;
    dischargeDay: string;
    sex: string;
    phone: string;
    mobilePhone: string;
    hierarchy: string;
    mail: string;
    source: string;
}

export interface MatchedRecord {
    record: basicMatchType;
    dataSource: string;
    runUID: string;
    updatedAt?: Date;
    lastPing?: Date;
}

export interface identifiersType {
    identityCard?: string;
    personalNumber?: string;
    goalUserId?: string;
    employeeId?: string;
}

export interface MergedOBJ {
    aka?: MatchedRecord[];
    es?: MatchedRecord[];
    sf?: MatchedRecord[];
    adnn?: MatchedRecord[];
    city?: MatchedRecord[];
    mir?: MatchedRecord[]; // undefined incase of having to delete records
    identifiers: identifiersType;
    updatedAt: Date;
    lock: number;
}

export type queryMongo = { [keys: string]: string }[];
