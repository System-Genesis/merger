import { identifiersType, MergedOBJ, queryMongo } from '../types/types';
import personsDB from './models';

export async function addToDb(foundIdentifiers: identifiersType[], mergedObj: MergedOBJ) {
    const insertSession = personsDB.startSession();
    try {
        await (
            await insertSession
        ).withTransaction(async () => {
            await personsDB.deleteMany({ $and: [{ $or: convertToMongoQuery(foundIdentifiers) }, { lock: { $lte: mergedObj.lock } }] });
            await personsDB.create(mergedObj);
            await (await insertSession).commitTransaction();
        });

        // add catch
    } finally {
        await (await insertSession).endSession();
    }
}

export const findManyByIdentifiers = async (identifiers: identifiersType) => {
    return await personsDB.find({ $or: convertToMongoQuery([identifiers]) }).lean();
};

export const insertOne = async (mergedRecord: MergedOBJ) => {
    return await personsDB.create(mergedRecord);
};

function convertToMongoQuery(identifiers: identifiersType[]): queryMongo {
    return identifiers.reduce((ids: queryMongo, idObj: identifiersType) => {
        return ids.concat(...Object.keys(idObj).map((key: string) => ({ [`identifiers.${key}`]: idObj[key] })));
    }, []);
}
