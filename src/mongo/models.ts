import mongoose from 'mongoose';
import config from '../config/index';
import { MergedOBJ } from '../types/types';

const MergedOBJSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: false, auto: true, select: false },
    aka: { type: [] },
    es: { type: [] },
    sf: { type: [] },
    city: { type: [] },
    adNN: { type: [] },
    mir: { type: [] },
    identifiers: {
        personalNumber: { type: String, unique: true, required: false, sparse: true },
        identityCard: { type: String, unique: true, required: false, sparse: true },
        goalUserId: { type: String, unique: true, required: false, sparse: true },
        employeeId: { type: String, unique: true, required: false, sparse: true },
    },
    lock: Number,
});

export default mongoose.model<MergedOBJ>(config.mongo.dataCollectionName, MergedOBJSchema);
