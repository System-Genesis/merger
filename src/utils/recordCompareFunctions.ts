export function akaCompare(record1: any, record2: any) {
    return record1.identityCard === record2.identityCard && record1.personalNumber === record2.personalNumber;
}
export function userIDCompare(record1: any, record2: any) {
    return record1.userID === record2.userID;
}
