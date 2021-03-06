/* eslint-disable no-console */
import * as mongoUtils from '../utils/mongoUtils';
import { MatchedRecord } from '../utils/mongoUtils';
import personsDB from '../utils/models';

const dotenv = require('dotenv');

dotenv.config();
mongoUtils.initializeMongo();
jest.setTimeout(30000);
test('merges record from aka and record from es', async () => {
    // const found2 = await personsDB.find({}).exec();
    // console.log(found2);
    await personsDB.deleteMany({});
    const matchedRecordes: MatchedRecord = {
        record: {
            job: 'Liaison - Forward Creative Supervisor',
            personalNumber: '2954115',
            lastName: 'Bogisich',
            firstName: 'Tianna',
            entityType: 'agumon',
            rank: 'champion',
            dischargeDay: '2023-12-22T04:47:41.597Z',
            sex: 'ז',
            phone: '9225',
            mobilePhone: '54-1178941',
            hierarchy: 'wallmart/consequatur/est/omnis',
            userID: 'Tianna_Bogisich',
            mail: 'Tianna_Bogisich@jello.com',
            source: 'es_name',
        },
        dataSource: 'es_name',
        timeStamp: '',
        updatedAt: new Date(),
        lastPing: new Date(),
    };
    const matchedRecordaka: MatchedRecord = {
        record: {
            job: 'Liaison - Forward Creative Supervisor',
            personalNumber: '2954115',
            lastName: 'Bogisich',
            firstName: 'Tianna',
            entityType: 'agumon',
            rank: 'champion',
            dischargeDay: '2023-12-22T04:47:41.597Z',
            sex: 'ז',
            phone: '9225',
            mobilePhone: '54-1178941',
            hierarchy: 'wallmart/consequatur/est/omnis',
            userID: 'Tianna_Bogisich',
            mail: 'Tianna_Bogisich@jello.com',
            source: 'aka',
        },
        dataSource: 'aka',
        timeStamp: '',
        updatedAt: new Date(),
        lastPing: new Date(),
    };
    await mongoUtils.matchedRecordHandler(matchedRecordes);
    await mongoUtils.matchedRecordHandler(matchedRecordaka);
    const found = await personsDB
        .find({
            $or: [
                { 'identifiers.personalNumber': matchedRecordes.record.personalNumber },
                { 'identifiers.identityCard': matchedRecordes.record.identityCard },
                { 'identifiers.goalUserId': matchedRecordes.record.goalUserId },
            ],
        })
        .exec();
    expect(found.length).toEqual(1);
});
test('merges 2 unrelated records after adding a 3rd record that links them together', async () => {
    await personsDB.deleteMany({});
    const matchedRecordes: MatchedRecord = {
        record: {
            job: 'Liaison - Forward Creative Supervisor',
            personalNumber: '2954115',
            lastName: 'Bogisich',
            firstName: 'Tianna',
            entityType: 'agumon',
            rank: 'champion',
            dischargeDay: '2023-12-22T04:47:41.597Z',
            sex: 'ז',
            phone: '9225',
            mobilePhone: '54-1178941',
            hierarchy: 'wallmart/consequatur/est/omnis',
            userID: 'Tianna_Bogisich',
            mail: 'Tianna_Bogisich@jello.com',
            source: 'es_name',
        },
        dataSource: 'es_name',
        timeStamp: '',
        updatedAt: new Date(),
        lastPing: new Date(),
    };
    const matchedRecordads: MatchedRecord = {
        record: {
            job: 'Liaison - Forward Creative Supervisor',
            identityCard: '5114592',
            lastName: 'Bogisich',
            firstName: 'Tianna',
            entityType: 'agumon',
            rank: 'champion',
            dischargeDay: '2023-12-22T04:47:41.597Z',
            sex: 'ז',
            phone: '9225',
            mobilePhone: '54-1178941',
            hierarchy: 'wallmart/consequatur/est/omnis',
            userID: 'Bogisich_Tianna',
            mail: 'Tianna_Bogisich@jello.com',
            source: 'ads_name',
        },
        dataSource: 'ads_name',
        timeStamp: '',
        updatedAt: new Date(),
        lastPing: new Date(),
    };
    const matchedRecordaka: MatchedRecord = {
        record: {
            job: 'Liaison - Forward Creative Supervisor',
            personalNumber: '2954115',
            identityCard: '5114592',
            lastName: 'Bogisich',
            firstName: 'Tianna',
            entityType: 'agumon',
            rank: 'champion',
            dischargeDay: '2023-12-22T04:47:41.597Z',
            sex: 'ז',
            phone: '9225',
            mobilePhone: '54-1178941',
            hierarchy: 'wallmart/consequatur/est/omnis',
            userID: 'Tianna_Bogisich',
            mail: 'Tianna_Bogisich@jello.com',
            source: 'aka',
        },
        dataSource: 'aka',
        timeStamp: '',
        updatedAt: new Date(),
        lastPing: new Date(),
    };
    await mongoUtils.matchedRecordHandler(matchedRecordes);
    // console.log('MATCHED ES NOW TO MATCH ADS');
    await mongoUtils.matchedRecordHandler(matchedRecordads);
    const foundBeforeLink = await personsDB.find({}).exec();

    // console.log('foundBeforeLink');
    // console.log(foundBeforeLink);
    expect(foundBeforeLink.length).toEqual(2);
    await mongoUtils.matchedRecordHandler(matchedRecordaka);
    const foundAfterLink = await personsDB
        .find({
            $or: [
                { 'identifiers.personalNumber': matchedRecordes.record.personalNumber },
                { 'identifiers.identityCard': matchedRecordes.record.identityCard },
                { 'identifiers.goalUserId': matchedRecordes.record.goalUserId },
            ],
        })
        .exec();
    expect(foundAfterLink.length).toEqual(1);
});
test('adding 4th record to the first 3', async () => {
    await personsDB.deleteMany({});
    const matchedRecordes: MatchedRecord = {
        record: {
            job: 'Liaison - Forward Creative Supervisor',
            personalNumber: '2954115',
            lastName: 'Bogisich',
            firstName: 'Tianna',
            entityType: 'agumon',
            rank: 'champion',
            dischargeDay: '2023-12-22T04:47:41.597Z',
            sex: 'ז',
            phone: '9225',
            mobilePhone: '54-1178941',
            hierarchy: 'wallmart/consequatur/est/omnis',
            userID: 'Tianna_Bogisich',
            mail: 'Tianna_Bogisich@jello.com',
            source: 'es_name',
        },
        dataSource: 'es_name',
        timeStamp: '',
        updatedAt: new Date(),
        lastPing: new Date(),
    };
    const matchedRecordads: MatchedRecord = {
        record: {
            job: 'Liaison - Forward Creative Supervisor',
            identityCard: '5114592',
            lastName: 'Bogisich',
            firstName: 'Tianna',
            entityType: 'agumon',
            rank: 'champion',
            dischargeDay: '2023-12-22T04:47:41.597Z',
            sex: 'ז',
            phone: '9225',
            mobilePhone: '54-1178941',
            hierarchy: 'wallmart/consequatur/est/omnis',
            userID: 'Bogisich_Tianna',
            mail: 'Tianna_Bogisich@jello.com',
            source: 'ads_name',
        },
        dataSource: 'ads_name',
        timeStamp: '',
        updatedAt: new Date(),
        lastPing: new Date(),
    };
    const matchedRecordaka: MatchedRecord = {
        record: {
            job: 'Liaison - Forward Creative Supervisor',
            personalNumber: '2954115',
            identityCard: '5114592',
            lastName: 'Bogisich',
            firstName: 'Tianna',
            entityType: 'agumon',
            rank: 'champion',
            dischargeDay: '2023-12-22T04:47:41.597Z',
            sex: 'ז',
            phone: '9225',
            mobilePhone: '54-1178941',
            hierarchy: 'wallmart/consequatur/est/omnis',
            userID: 'Tianna_Bogisich',
            mail: 'Tianna_Bogisich@jello.com',
            source: 'aka',
        },
        dataSource: 'aka',
        timeStamp: '',
        updatedAt: new Date(),
        lastPing: new Date(),
    };
    const matchedRecordsf: MatchedRecord = {
        record: {
            job: 'Liaison - Forward Creative Supervisor',
            identityCard: '5114592',
            lastName: 'Bogisich',
            firstName: 'Tianna',
            entityType: 'agumon',
            rank: 'champion',
            dischargeDay: '2023-12-22T04:47:41.597Z',
            sex: 'ז',
            phone: '9225',
            mobilePhone: '54-1178941',
            hierarchy: 'wallmart/consequatur/est/omnis',
            userID: 'Bogisich_Tianna',
            mail: 'Tianna_Bogisich@jello.com',
            source: 'sf_name',
        },
        dataSource: 'sf_name',
        timeStamp: '',
        updatedAt: new Date(),
        lastPing: new Date(),
    };
    await mongoUtils.matchedRecordHandler(matchedRecordes);
    await mongoUtils.matchedRecordHandler(matchedRecordads);
    await mongoUtils.matchedRecordHandler(matchedRecordaka);
    await mongoUtils.matchedRecordHandler(matchedRecordsf);

    const resultPerson = await personsDB.find({}).exec();

    // console.log('resultPerson');
    // console.log(resultPerson);
    expect(resultPerson.length).toEqual(1);
});
