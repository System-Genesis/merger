import * as dotenv from 'dotenv';
import { MatchedRecord } from '../src/types/types';
import personsDB from '../src/mongo/models';
import { matchedRecordHandler } from '../src/service/margeHandler';
import { initializeMongo } from '../src/mongo/init';
import { mongoQueryByIds } from '../src/utils/identifiersUtils';
dotenv.config();

let sendToRabbit = 0;
jest.mock('logger-genesis');
jest.mock('../src/rabbit/init.ts', () => ({
    sendToQueue: () => {
        sendToRabbit++;
    },
}));

initializeMongo();

jest.setTimeout(30000);

describe('', () => {
    beforeEach(() => {
        sendToRabbit = 0;
    });

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
            runUID: '',
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
            runUID: '',
            updatedAt: new Date(),
            lastPing: new Date(),
        };

        await matchedRecordHandler(matchedRecordes);
        await matchedRecordHandler(matchedRecordaka);
        const found = await personsDB
            .find({
                $or: [
                    { 'identifiers.personalNumber': matchedRecordes.record.personalNumber },
                    { 'identifiers.identityCard': matchedRecordes.record.identityCard },
                    { 'identifiers.goalUserId': matchedRecordes.record.goalUserId },
                    { 'identifiers.employeeId': matchedRecordes.record.employeeId },
                ],
            })
            .exec();
        expect(found.length).toEqual(1);
        expect(sendToRabbit).toEqual(2);
    });

    test('merges 2 unrelated records after adding a 3rd record that links them together', async () => {
        await personsDB.deleteMany({});

        // personalNumber: '1',
        const matchedRecord_ES: MatchedRecord = {
            record: {
                job: 'Liaison - Forward Creative Supervisor',
                personalNumber: '1',
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
            runUID: '',
            updatedAt: new Date(),
            lastPing: new Date(),
        };

        // identityCard: '2',
        // userID: 'user_1',
        const matchedRecord_adNN: MatchedRecord = {
            record: {
                job: 'Liaison - Forward Creative Supervisor',
                identityCard: '2',
                lastName: 'Bogisich',
                firstName: 'Tianna',
                entityType: 'agumon',
                rank: 'champion',
                dischargeDay: '2023-12-22T04:47:41.597Z',
                sex: 'ז',
                phone: '9225',
                mobilePhone: '54-1178941',
                hierarchy: 'wallmart/consequatur/est/omnis',
                userID: 'user_1',
                mail: 'Tianna_Bogisich@jello.com',
                source: 'adNN_name',
            },
            dataSource: 'adNN_name',
            runUID: '',
            updatedAt: new Date(),
            lastPing: new Date(),
        };

        // identityCard: '2',
        // userID: 'user_2',
        const matchedRecord_adNN_2: MatchedRecord = {
            record: {
                job: 'Liaison - Forward Creative Supervisor',
                identityCard: '2',
                lastName: 'Bogisich',
                firstName: 'Tianna',
                entityType: 'agumon',
                rank: 'champion',
                dischargeDay: '2023-12-22T04:47:41.597Z',
                sex: 'ז',
                phone: '9225',
                mobilePhone: '54-1178941',
                hierarchy: 'wallmart/consequatur/est/omnis',
                userID: 'user_2',
                mail: 'Tianna_Bogisich@jello.com',
                source: 'adNN_name',
            },
            dataSource: 'adNN_name',
            runUID: '',
            updatedAt: new Date(),
            lastPing: new Date(),
        };

        // personalNumber: '1',
        // identityCard: '2',
        const matchedRecord_aka: MatchedRecord = {
            record: {
                job: 'Liaison - Forward Creative Supervisor',
                personalNumber: '1',
                identityCard: '2',
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
                source: 'aka',
            },
            dataSource: 'aka',
            runUID: '',
            updatedAt: new Date(),
            lastPing: new Date(),
        };

        await matchedRecordHandler(matchedRecord_ES);
        await matchedRecordHandler(matchedRecord_ES);

        await matchedRecordHandler(matchedRecord_adNN);
        await matchedRecordHandler(matchedRecord_adNN_2);
        const foundBeforeLink = await personsDB.find({}).lean();

        expect(foundBeforeLink.length).toEqual(2);
        expect(foundBeforeLink[1].adNN?.length).toEqual(2);
        expect(foundBeforeLink[0].es?.length).toEqual(1);
        await matchedRecordHandler(matchedRecord_aka);
        await matchedRecordHandler(matchedRecord_adNN);
        await matchedRecordHandler(matchedRecord_adNN_2);
        await matchedRecordHandler(matchedRecord_adNN);
        await matchedRecordHandler(matchedRecord_adNN_2);

        matchedRecord_adNN_2.record.firstName = 'new Name';
        await matchedRecordHandler(matchedRecord_adNN_2);

        matchedRecord_ES.record.firstName = 'temp Name';
        await matchedRecordHandler(matchedRecord_ES);

        const esTempName: any[] = await personsDB.find({ $or: mongoQueryByIds(matchedRecord_ES.record) }).lean();
        expect(esTempName[0].es[0].record.firstName).toEqual('temp Name');

        matchedRecord_ES.record.firstName = 'new Name';
        await matchedRecordHandler(matchedRecord_ES);

        const foundAfterLink: any[] = await personsDB.find({ $or: mongoQueryByIds(matchedRecord_ES.record) }).lean();

        expect(foundAfterLink.length).toEqual(1);
        expect(foundAfterLink[0].adNN.length).toEqual(2);
        expect(foundAfterLink[0].adNN[1].record.firstName).toEqual('new Name');
        expect(foundAfterLink[0].es[0].record.firstName).toEqual('new Name');
        expect(sendToRabbit).toEqual(7);
    });

    test('delete duplicate records with same user id', async () => {
        await personsDB.deleteMany({});

        const esRecord = {
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
            runUID: '',
            updatedAt: new Date(),
            lastPing: new Date(),
        };

        // set 4 same record of es
        await personsDB.create({
            es: [esRecord, esRecord, esRecord, esRecord],
            identifiers: {
                personalNumber: '2954115',
            },
            lock: 0,
            __v: 0,
        });

        await matchedRecordHandler(esRecord);

        const foundAfterLink: any[] = await personsDB.find({ $or: mongoQueryByIds(esRecord.record) }).lean();
        expect(foundAfterLink[0].es.length).toEqual(1);
        expect(sendToRabbit).toEqual(0);
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
            runUID: '',
            updatedAt: new Date(),
            lastPing: new Date(),
        };
        const matchedRecordadNN: MatchedRecord = {
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
                source: 'adNN_name',
            },
            dataSource: 'adNN_name',
            runUID: '',
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
            runUID: '',
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
            runUID: '',
            updatedAt: new Date(),
            lastPing: new Date(),
        };
        await matchedRecordHandler(matchedRecordes);
        await matchedRecordHandler(matchedRecordadNN);
        await matchedRecordHandler(matchedRecordaka);
        await matchedRecordHandler(matchedRecordsf);

        const resultPerson = await personsDB.find({}).exec();

        // console.log('resultPerson');
        // console.log(resultPerson);
        expect(resultPerson.length).toEqual(1);
    });
});
