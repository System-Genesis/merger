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
    _id: { type: mongoose.Schema.Types.ObjectId, required: false, auto: true, select: false },
    aka: { type: [], require: false, default: undefined },
    es: { type: [], require: false, default: undefined },
    sf: { type: [], require: false, default: undefined },
    city: { type: [], require: false, default: undefined },
    adnn: { type: [], require: false, default: undefined },
    mir: { type: [], require: false, default: undefined },
    identifiers: {
        personalNumber: { type: String, unique: true, required: false, sparse: true },
        identityCard: { type: String, unique: true, required: false, sparse: true },
        goalUserId: { type: String, unique: true, required: false, sparse: true },
        employeeId: { type: String, unique: true, required: false, sparse: true },
    },
    lock: Number,
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
    identifiers: { personalNumber: string; identityCard: string; goalUserId: string; employeeId: string };
    updatedAt: Date;
    lock: number;
};
export default mongoose.model<MergedOBJ>(config.mongo.dataCollectionName, MergedOBJSchema);
