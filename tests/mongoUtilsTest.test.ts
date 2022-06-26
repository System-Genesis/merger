import * as dotenv from 'dotenv';
import { MatchedRecord } from '../src/types/types';
import personsDB from '../src/mongo/models';
import { matchedRecordHandler } from '../src/service/mergeHandler';
import { initializeMongo } from '../src/mongo/init';
import { mongoQueryByIds } from '../src/utils/identifiersUtils';
import { base_record } from './mockRecords';

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
        const found2 = await personsDB.find({}).exec();
        console.log(found2);
        await personsDB.deleteMany({});

        const matchedRecordes: MatchedRecord = base_record({ personalNumber: '2954115', userID: 'Tianna_Bogisich', source: 'es_name' });
        const matchedRecordaka: MatchedRecord = base_record({ personalNumber: '2954115', source: 'aka' });

        await matchedRecordHandler(matchedRecordes);
        expect(sendToRabbit).toEqual(1);
        await matchedRecordHandler(matchedRecordaka);
        expect(sendToRabbit).toEqual(2);
        const found = await personsDB.find({ $or: mongoQueryByIds(matchedRecordes.record) }).exec();

        expect(found.length).toEqual(1);
    });

    test('merges 2 unrelated records after adding a 3rd record that links them together', async () => {
        await personsDB.deleteMany({});

        const matchedRecord_ES: MatchedRecord = base_record({ personalNumber: '1', userID: 'Tianna_Bogisich', source: 'es_name' });
        const matchedRecord_adNN: MatchedRecord = base_record({ identityCard: '2', userID: 'user_1', source: 'adNN_name' });
        const matchedRecord_adNN_2: MatchedRecord = base_record({ identityCard: '2', userID: 'user_2', source: 'adNN_name' });
        const matchedRecord_aka: MatchedRecord = base_record({ identityCard: '2', personalNumber: '1', source: 'aka' });

        await matchedRecordHandler(matchedRecord_ES);
        expect(sendToRabbit).toEqual(1);
        await matchedRecordHandler(matchedRecord_ES);

        await matchedRecordHandler(matchedRecord_adNN);
        expect(sendToRabbit).toEqual(2);
        await matchedRecordHandler(matchedRecord_adNN_2);
        expect(sendToRabbit).toEqual(3);
        const foundBeforeLink = await personsDB.find({}).lean();

        expect(foundBeforeLink.length).toEqual(2);
        expect(foundBeforeLink[1].adNN?.length).toEqual(2);
        expect(foundBeforeLink[0].es?.length).toEqual(1);
        await matchedRecordHandler(matchedRecord_aka);
        expect(sendToRabbit).toEqual(4);
        await matchedRecordHandler(matchedRecord_adNN);
        await matchedRecordHandler(matchedRecord_adNN_2);
        await matchedRecordHandler(matchedRecord_adNN);
        await matchedRecordHandler(matchedRecord_adNN_2);

        matchedRecord_adNN_2.record.firstName = 'new Name';
        await matchedRecordHandler(matchedRecord_adNN_2);
        expect(sendToRabbit).toEqual(5);

        matchedRecord_ES.record.firstName = 'temp Name';
        await matchedRecordHandler(matchedRecord_ES);
        expect(sendToRabbit).toEqual(6);

        const esTempName: any[] = await personsDB.find({ $or: mongoQueryByIds(matchedRecord_ES.record) }).lean();
        expect(esTempName[0].es[0].record.firstName).toEqual('temp Name');

        matchedRecord_ES.record.firstName = 'new Name';
        await matchedRecordHandler(matchedRecord_ES);
        expect(sendToRabbit).toEqual(7);

        const foundAfterLink: any[] = await personsDB.find({ $or: mongoQueryByIds(matchedRecord_ES.record) }).lean();

        expect(foundAfterLink.length).toEqual(1);
        expect(foundAfterLink[0].adNN.length).toEqual(2);
        expect(foundAfterLink[0].adNN[1].record.firstName).toEqual('new Name');
        expect(foundAfterLink[0].es[0].record.firstName).toEqual('new Name');
    });

    test('delete duplicate records with same user id', async () => {
        await personsDB.deleteMany({});

        const esRecord: MatchedRecord = base_record({ personalNumber: '2954115', userID: 'Tianna_Bogisich', source: 'es_name' });

        // set 4 same record of es
        await personsDB.create({
            es: [esRecord, esRecord, esRecord, esRecord],
            identifiers: { personalNumber: '2954115' },
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
        const matchedRecordes: MatchedRecord = base_record({ personalNumber: '1', userID: 'Tianna_Bogisich', source: 'es_name' });
        const matchedRecordadNN: MatchedRecord = base_record({ identityCard: '2', userID: 'Bogisich_Tianna', source: 'adNN_name' });
        const matchedRecordaka: MatchedRecord = base_record({ personalNumber: '1', identityCard: '2', source: 'aka' });
        const matchedRecordsf: MatchedRecord = base_record({ identityCard: '2', userID: 'B_Tianna', source: 'sf_name' });

        await matchedRecordHandler(matchedRecordes);
        await matchedRecordHandler(matchedRecordadNN);
        await matchedRecordHandler(matchedRecordaka);
        await matchedRecordHandler(matchedRecordsf);

        const resultPerson = await personsDB.find({}).exec();

        console.log('resultPerson');
        console.log(resultPerson);
        expect(resultPerson.length).toEqual(1);
    });

    test('replace mir with city', async () => {
        await personsDB.deleteMany({});

        const matchedRecord_CITY: MatchedRecord = base_record({ personalNumber: '1', userID: 'Tianna_Bogisich', source: 'city_name' });
        const matchedRecord_MIR: MatchedRecord = base_record({ personalNumber: '1', userID: 'Tianna_Bogisich', source: 'mir_name' });

        await matchedRecordHandler(matchedRecord_CITY);
        await matchedRecordHandler(matchedRecord_MIR);

        const foundAfterLink: any[] = await personsDB.find({ $or: mongoQueryByIds(matchedRecord_MIR.record) }).lean();
        expect(foundAfterLink[0].mir.length).toEqual(1);
        expect(foundAfterLink[0].city).toBeFalsy();
    });
    test('replace mir with city has city left', async () => {
        await personsDB.deleteMany({});

        const matchedRecord_CITY: MatchedRecord = base_record({ personalNumber: '1', userID: 'Tianna_Bogisich', source: 'city_name' });
        const matchedRecord_CITY_2: MatchedRecord = base_record({ personalNumber: '1', userID: 'Tianna_Bogisich2', source: 'city_name' });
        const matchedRecord_MIR: MatchedRecord = base_record({ personalNumber: '1', userID: 'Tianna_Bogisich', source: 'mir_name' });

        await matchedRecordHandler(matchedRecord_CITY);
        await matchedRecordHandler(matchedRecord_CITY_2);
        let foundAfterLink: any[] = await personsDB.find({ $or: mongoQueryByIds(matchedRecord_MIR.record) }).lean();
        expect(foundAfterLink[0].mir).toBeFalsy();
        expect(foundAfterLink[0].city.length).toEqual(2);

        await matchedRecordHandler(matchedRecord_MIR);

        foundAfterLink = await personsDB.find({ $or: mongoQueryByIds(matchedRecord_MIR.record) }).lean();
        expect(foundAfterLink[0].mir.length).toEqual(1);
        expect(foundAfterLink[0].city.length).toEqual(1);
    });

    test('replace city with mir', async () => {
        await personsDB.deleteMany({});

        const matchedRecord_CITY: MatchedRecord = base_record({ personalNumber: '1', userID: 'Tianna_Bogisich', source: 'city_name' });
        const matchedRecord_MIR: MatchedRecord = base_record({ personalNumber: '1', userID: 'Tianna_Bogisich', source: 'mir_name' });

        await matchedRecordHandler(matchedRecord_MIR);
        await matchedRecordHandler(matchedRecord_CITY);

        const foundAfterLink: any[] = await personsDB.find({ $or: mongoQueryByIds(matchedRecord_MIR.record) }).lean();
        expect(foundAfterLink[0].city.length).toEqual(1);
        expect(foundAfterLink[0].mir).toBeFalsy();
    });
    test('replace mir with city has city left', async () => {
        await personsDB.deleteMany({});

        const matchedRecord_CITY: MatchedRecord = base_record({ personalNumber: '1', userID: 'Tianna_Bogisich', source: 'city_name' });
        const matchedRecord_MIR_2: MatchedRecord = base_record({ personalNumber: '1', userID: 'Tianna_Bogisich2', source: 'mir_name' });
        const matchedRecord_MIR: MatchedRecord = base_record({ personalNumber: '1', userID: 'Tianna_Bogisich', source: 'mir_name' });

        await matchedRecordHandler(matchedRecord_MIR);
        await matchedRecordHandler(matchedRecord_MIR_2);
        let foundAfterLink: any[] = await personsDB.find({ $or: mongoQueryByIds(matchedRecord_MIR.record) }).lean();
        expect(foundAfterLink[0].city).toBeFalsy();
        expect(foundAfterLink[0].mir.length).toEqual(2);

        await matchedRecordHandler(matchedRecord_CITY);
        foundAfterLink = await personsDB.find({ $or: mongoQueryByIds(matchedRecord_MIR.record) }).lean();
        expect(foundAfterLink[0].city.length).toEqual(1);
        expect(foundAfterLink[0].mir.length).toEqual(1);
    });

    test('conflict ids', async () => {
        await personsDB.deleteMany({});

        const matchedRecord_1: MatchedRecord = base_record({ personalNumber: '1', userID: 'Tn_Boh2', source: 'mir_name' });
        const matchedRecord_2_8: MatchedRecord = base_record({ personalNumber: '2', identityCard: '8', userID: 'Tn_Boh2', source: 'mir_name' });
        const matchedRecord_1_8: MatchedRecord = base_record({ personalNumber: '1', identityCard: '8', userID: 'Tn_Boh2', source: 'mir_name' });

        await matchedRecordHandler(matchedRecord_1);
        expect(sendToRabbit).toEqual(1);
        await matchedRecordHandler(matchedRecord_2_8);
        expect(sendToRabbit).toEqual(2);
        await matchedRecordHandler(matchedRecord_1_8);
        expect(sendToRabbit).toEqual(2);

        let foundAfterLink: any[] = await personsDB.find({}).lean();

        expect(foundAfterLink.length).toEqual(2);
    });
});
