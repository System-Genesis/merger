/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import * as mongoose from 'mongoose';
import menash, { ConsumerMessage } from 'menashmq';
import Server from './express/server';
import config from './config';
import * as compareFunctions from './utils/recordCompareFunctions';

const { mongo, rabbit, service } = config;

interface RecordWrapper {
    record: any;
    dataSource: string;
    timeStamp: string;
}

interface DBPerson {
    aka: any;
    ads: any;
    es: any;
    identifiers: { personalNumber: string; identityCard: string; goalUserId: string };
}
function findAndUpdateRecord(records: any[], record: any, compareFunction: (record1, record2) => boolean): any[] {
    if (records && records.length) {
        records.filter((recordIter) => {
            return compareFunction(recordIter, record);
        });
        if (records.length) {
            // check for update/diff
            for (let i = 0; i < records.length; i += 1) {
                const recordIter = records[i];
                if (JSON.stringify(recordIter) !== JSON.stringify(record)) {
                    records[i] = recordIter;
                }
            }
        } else {
            records.push(record);
        }
    } else {
        records = [record]; // does it change the original? probably not
    }
    return records;
}

const findInMongo = async (record: any): Promise<DBPerson> => {
    // const db = mongoose.Connection;
    const personSchema = new mongoose.Schema({
        aka: { type: mongoose.Schema.Types.ObjectId },
        ads: { type: mongoose.Schema.Types.ObjectId },
        es: { type: mongoose.Schema.Types.ObjectId },
        identifiers: { personalNumber: String, identityCard: String, goalUserId: String },
    });
    const personsDB = mongoose.model('Person', personSchema);
    return personsDB.findOne({
        $or: [
            { 'identifiers.personalNumber': record.identifiers.personalNumber },
            { 'identifiers.identityCard': record.identifiers.identityCard },
            { 'identifiers.goalUserId': record.identifiers.goalUserId },
        ],
    });
};

const initializeMongo = async () => {
    console.log('Connecting to Mongo...');

    await mongoose.connect(mongo.uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });

    console.log('Mongo connection established');
};

const initializeRabbit = async () => {
    console.log('Connecting to Rabbit...');

    await menash.connect(rabbit.uri, rabbit.retryOptions);
    await menash.declareQueue(rabbit.beforeMerge);
    console.log('Rabbit connected');

    const featureConsumeFunction = async (msg: ConsumerMessage) => {
        console.log('Received message: ', msg.getContent());
        const recordWrapper: RecordWrapper = msg.getContent() as RecordWrapper;
        const mergedRecords: DBPerson = await findInMongo(recordWrapper.record);
        const recordDataSource: string = recordWrapper.dataSource;
        switch (recordDataSource) {
            case 'aka': {
                mergedRecords.aka = findAndUpdateRecord(mergedRecords.aka, recordWrapper.record, compareFunctions.akaCompare);
                break;
            }
            case 'ads': {
                mergedRecords.ads = findAndUpdateRecord(mergedRecords.ads, recordWrapper.record, compareFunctions.userIDCompare);
                break;
            }
            case 'es': {
                mergedRecords.es = findAndUpdateRecord(mergedRecords.es, recordWrapper.record, compareFunctions.userIDCompare);
                break;
            }
            default:
        }
    };
    await menash.declareTopology({
        queues: [{ name: 'feature-queue', options: { durable: true } }],
        exchanges: [{ name: 'feature-exchange', type: 'fanout', options: { durable: true } }],
        bindings: [{ source: 'feature-exchange', destination: 'feature-queue' }],
        consumers: [{ queueName: 'feature-queue', onMessage: featureConsumeFunction }],
    });

    console.log('Rabbit initialized');
};

const main = async () => {
    await initializeMongo();

    await initializeRabbit();

    const server = new Server(service.port);

    await server.start();

    console.log(`Server started on port: ${service.port}`);
};

main().catch((err) => console.error(err));
