import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import config from '../config/index';

/* const kartoffelMockSchema = new Schema({
    firstName: String,
    lastNmae: String,
    id: { type: Number, unique: true },
}); */

const DBpersonSchema = new mongoose.Schema({
    aka: { type: mongoose.Schema.Types.ObjectId },
    ads: { type: mongoose.Schema.Types.ObjectId },
    es: { type: mongoose.Schema.Types.ObjectId },
    identifiers: { personalNumber: String, identityCard: String, goalUserId: String },
});

const changeStreamSchema = new Schema({
    eventId: { type: String, unique: true },
    description: Object,
});

export const myModel = mongoose.model(config.mongo.dataCollectionName, DBpersonSchema);
export const changeStreamTrackerModel = mongoose.model(config.mongo.eventsCollectionName, changeStreamSchema);
