import mongoose from 'mongoose';
import config from '../config/index';
import { MergedOBJ } from '../types/types';

const MergedOBJSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: false, auto: true, select: false },
    aka: { type: [], require: false, default: undefined },
    es: { type: [], require: false, default: undefined },
    sf: { type: [], require: false, default: undefined },
    city: { type: [], require: false, default: undefined },
    adNN: { type: [], require: false, default: undefined },
    mir: { type: [], require: false, default: undefined },
    identifiers: {
        personalNumber: { type: String, unique: true, required: false, sparse: true },
        identityCard: { type: String, unique: true, required: false, sparse: true },
        goalUserId: { type: String, unique: true, required: false, sparse: true },
        employeeId: { type: String, unique: true, required: false, sparse: true },
    },
    lock: Number,
});

export default mongoose.model<MergedOBJ>(config.mongo.dataCollectionName, MergedOBJSchema);
