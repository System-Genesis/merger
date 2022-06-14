import logger from 'logger-genesis';
import config from './config/index';

export default async () => {
    await logger.initialize(config.systemName, config.service.name, config.rabbit.logQueue, false);
};
