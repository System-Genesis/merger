/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import menash from 'menashmq';
import logger from 'logger-genesis';
import initLogger from './utils/logger';
import config from './config';
import { initializeMongo, featureConsumeFunction } from './utils/mongoUtils';
import { scopeOption } from './utils/log';

const fn = require('./config/fieldNames');

const { logFields } = fn;

const { rabbit } = config;

const initializeRabbit = async () => {
    await menash.connect(rabbit.uri, rabbit.retryOptions);
    await menash.declareQueue(rabbit.matchedRecords);
    await menash.declareQueue(rabbit.afterMerge);
    // await menash.declareQueue(rabbit.logQueue);
    await initLogger();
    await menash.queue(rabbit.matchedRecords).prefetch(rabbit.prefetch);
    await menash.queue(rabbit.matchedRecords).activateConsumer(featureConsumeFunction, { noAck: false });
};

const main = async () => {
    await initializeRabbit();
    logger.info(false, logFields.scopes.system as scopeOption, 'Initialized Rabbit', 'Initialized Rabbit');

    await initializeMongo();
    logger.info(false, logFields.scopes.system as scopeOption, 'Initialized Mongo', 'Initialized Mongo');

    logger.info(false, logFields.scopes.system as scopeOption, 'Initialized Server', 'Start');
};

main().catch((err) => logger.error(false, logFields.scopes.system as scopeOption, 'Traking System Crash', err.message)); // change to log
