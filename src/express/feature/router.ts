import { Router } from 'express';
import FeatureController from './controller';
import FeatureValidator from './validator';
import { wrapController, wrapValidator } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import { getFoldersRequestSchema, createFolderRequestSchema } from './validator.schema';

const featureRouter: Router = Router();

featureRouter.get('/folders', ValidateRequest(getFoldersRequestSchema), wrapController(FeatureController.getFolders));
featureRouter.post('/folders', ValidateRequest(createFolderRequestSchema), wrapController(FeatureController.createFolder));
featureRouter.get('/folders/hardToValidateWithSchema', wrapValidator(FeatureValidator.somethingThatIsImpossibleToValidateWithSchema));

export default featureRouter;
