import { MatchedRecord } from '../src/types/types';

type BASE_RECORD = {
    source?: string;
    personalNumber?: string;
    identityCard?: string;
    userID?: string;
};

export const base_record = ({ source, personalNumber, identityCard, userID }: BASE_RECORD): MatchedRecord => {
    let base = <MatchedRecord>{
        record: {
            job: 'Liaison - Forward Creative Supervisor',
            lastName: 'Bogisich',
            firstName: 'Tianna',
            entityType: 'agumon',
            rank: 'champion',
            dischargeDay: '2023-12-22T04:47:41.597Z',
            sex: 'ז',
            phone: '9225',
            mobilePhone: '54-1178941',
            hierarchy: 'wallmart/consequatur/est/omnis',
            mail: 'Tianna_Bogisich@jello.com',
        },
        runUID: '',
        updatedAt: new Date(),
        lastPing: new Date(),
    };

    base = {
        ...base,
        record: {
            ...base.record,
            ...(personalNumber && { personalNumber }),
            ...(identityCard && { identityCard }),
            ...(userID && { userID }),
            ...(source && { source }),
        },
        ...(source && { dataSource: source }),
    };

    return base;
};
