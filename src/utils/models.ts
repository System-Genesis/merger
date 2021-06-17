import * as mongoose from 'mongoose';
import config from '../config/index';

/* const kartoffelMockSchema = new Schema({
    firstName: String,
    lastNmae: String,
    id: { type: Number, unique: true },
}); */

const MergedOBJSchema = new mongoose.Schema({
    aka: { type: mongoose.Schema.Types.ObjectId },
    ads: { type: mongoose.Schema.Types.ObjectId },
    es: { type: mongoose.Schema.Types.ObjectId },
    identifiers: { personalNumber: String, identityCard: String, goalUserId: String },
});

export default mongoose.model(config.mongo.dataCollectionName, MergedOBJSchema);
