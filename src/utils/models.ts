import * as mongoose from 'mongoose';
import config from '../config/index';

/* const kartoffelMockSchema = new Schema({
    firstName: String,
    lastNmae: String,
    id: { type: Number, unique: true },
}); */
/* interface MatchedRecord {
    record: any;
    source: string;
    timeStamp: string;
}

const MatchedRecordSchema = new mongoose.Schema({ record: Object, source: String, timeStamp: String }); */
const MergedOBJSchema = new mongoose.Schema({
    aka: { type: mongoose.Schema.Types.Array },
    es: { type: mongoose.Schema.Types.Array },
    sf: { type: mongoose.Schema.Types.Array },
    adnn: { type: mongoose.Schema.Types.Array },
    city: { type: mongoose.Schema.Types.Array },
    mir: { type: mongoose.Schema.Types.Array },
    identifiers: {
        personalNumber: { type: String, unique: true },
        identityCard: { type: String, unique: true },
        goalUserId: { type: String, unique: true },
    },
});

type MatchedRecord = {
    record: any;
    dataSource: string;
    timeStamp: string;
    updatedAt?: Date;
    lastPing?: Date;
};

type MergedOBJ = {
    aka: MatchedRecord[];
    es: MatchedRecord[];
    sf: MatchedRecord[];
    adnn: MatchedRecord[];
    city: MatchedRecord[];
    mir: MatchedRecord[];
    identifiers: { personalNumber: string; identityCard: string; goalUserId: string };
    updatedAt: Date;
};
export default mongoose.model<MergedOBJ>(config.mongo.dataCollectionName, MergedOBJSchema);
