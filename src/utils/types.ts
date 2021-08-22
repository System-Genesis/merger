export interface MatchedRecord {
    record: any;
    dataSource: string;
    timeStamp: string;
    updatedAt?: Date;
    lastPing?: Date;
}

export interface MergedOBJ {
    aka: MatchedRecord[];
    ads: MatchedRecord[];
    es: MatchedRecord[];
    sf: MatchedRecord[];
    adnn: MatchedRecord[];
    city: MatchedRecord[];
    nv: MatchedRecord[];
    mir: MatchedRecord[];
    lmn: MatchedRecord[];
    mdn: MatchedRecord[];
    identifiers: { personalNumber: string; identityCard: string; goalUserId: string };
    updatedAt: Date;
}
