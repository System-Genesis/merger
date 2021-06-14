import { v4 as uuid } from 'uuid';
import FolderModel from './model';
import { IFolder } from './interface';

export class FeatureManager {
    static getFolders(query: Partial<IFolder>) {
        return FolderModel.find(query).exec();
    }

    static createFolder(folder: Omit<IFolder, 'folderId'>) {
        const newFolder = { ...folder, folderId: uuid() };
        return FolderModel.create(newFolder);
    }
}

export default FeatureManager;
