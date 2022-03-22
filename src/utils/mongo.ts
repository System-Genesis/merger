/* eslint-disable  */
import * as mongoose from 'mongoose';
import config from '../config';
import { MergedOBJ, queryMongo } from './types';
import personsDB from './models';

export const initializeMongo = async () => {
    await mongoose.connect(config.mongo.uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });
};

export async function addToDb(foundIdentifiers: queryMongo, mergedRecord: MergedOBJ) {
    const insertSession = personsDB.startSession();
    try {
        await (
            await insertSession
        ).withTransaction(async () => {
            await personsDB.collection.deleteMany({ $and: [{ $or: foundIdentifiers }, { lock: { $lte: mergedRecord.lock } }] });
            await personsDB.collection.insertOne(mergedRecord);
            await (await insertSession).commitTransaction();
        });

        // add catch
    } finally {
        await (await insertSession).endSession();
    }
}

export const findManyByIdentifiers = async (identifiers: queryMongo) => {
    return await personsDB.find({ $or: identifiers }).lean();
};

export const insertOne = async (mergedRecord: MergedOBJ) => {
    return await personsDB.collection.insertOne(mergedRecord);
};
