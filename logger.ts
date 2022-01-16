import logger from 'logger-genesis';
import envConfig from './src/config/index';

export default async () => {
    await logger.initialize(envConfig.systemName, envConfig.service.name, envConfig.rabbit.logQueue, false);
};
