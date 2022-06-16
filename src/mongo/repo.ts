import { MergedOBJ, queryMongo } from '../types/types';
import personsDB from './models';

export async function addToDb(foundIdentifiers: queryMongo, mergedRecord: MergedOBJ) {
    const insertSession = personsDB.startSession();
    try {
        await (
            await insertSession
        ).withTransaction(async () => {
            await personsDB.deleteMany({ $and: [{ $or: foundIdentifiers }, { lock: { $lte: mergedRecord.lock } }] });
            await personsDB.create(mergedRecord);
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
    return await personsDB.create(mergedRecord);
};
