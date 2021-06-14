import { Request, Response } from 'express';
import { FeatureManager } from './manager';

class FeatureController {
    static async getFolders(req: Request, res: Response) {
        res.json(await FeatureManager.getFolders(req.query));
    }

    static async createFolder(req: Request, res: Response) {
        res.json(await FeatureManager.createFolder(req.body));
    }
}

export default FeatureController;
