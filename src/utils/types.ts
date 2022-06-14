// TODO basicMatch type

export interface basicMatchType {
    personalNumber?: string;
    identityCard?: string;
    goalUserId?: string;
    userID?: string;
}

export interface MatchedRecord {
    record: any;
    dataSource: string;
    timeStamp: string;
    updatedAt?: Date;
    lastPing?: Date;
}
export interface identifiersType {
    identityCard?: string;
    personalNumber?: string;
    goalUserId?: string;
}
export interface MergedOBJ {
    aka?: MatchedRecord[];
    es?: MatchedRecord[];
    sf?: MatchedRecord[];
    adnn?: MatchedRecord[];
    city?: MatchedRecord[];
    mir?: MatchedRecord[]; // undefined incase of having to delete records
    identifiers: { personalNumber?: string; identityCard?: string; goalUserId?: string };
    updatedAt: Date;
    lock: number;
}

export type queryMongo = { [keys: string]: string }[];
