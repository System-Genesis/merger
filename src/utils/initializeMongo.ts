/* eslint-disable no-return-await */
import * as mongoose from 'mongoose';
import config from '../config';
import personsDB from './models';

const { mongo } = config;

const initializeMongo = async () => {
    await mongoose.connect(mongo.uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });
};

export default initializeMongo;

export const findByIdentifiers = async (identifiers) => {
    return await personsDB.collection
        .find({
            $or: identifiers,
        })
        .toArray();
};

export const deleteMany = async (identifiers) => {
    return await personsDB.deleteMany({
        $or: identifiers,
    });
};

export const insertOne = async (mergedRecord) => {
    return await personsDB.collection.insertOne(mergedRecord);
};
