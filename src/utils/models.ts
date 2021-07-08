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
    ads: { type: mongoose.Schema.Types.Array },
    es: { type: mongoose.Schema.Types.Array },
    identifiers: { personalNumber: String, identityCard: String, goalUserId: String },
});

export default mongoose.model(config.mongo.dataCollectionName, MergedOBJSchema);
