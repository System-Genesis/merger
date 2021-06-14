import * as mongoose from 'mongoose';

import { IFolder } from './interface';
import config from '../../config';

const FolderSchema = new mongoose.Schema({
    folderId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
});

const FolderModel = mongoose.model<IFolder & mongoose.Document>(config.mongo.featureCollectionName, FolderSchema);

export default FolderModel;
