import mongoose from 'mongoose';
import config from '../config';

export const initializeMongo = async () => {
    await mongoose.connect(config.mongo.uri);
};
