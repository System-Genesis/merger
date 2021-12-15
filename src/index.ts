/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import menash from 'menashmq';
import logger from 'logger-genesis';
import Server from './express/server';
import config from './config';
import { initializeMongo, featureConsumeFunction } from './utils/mongoUtils';
import { scopeOption } from '../types/log';

const fn = require('./config/fieldNames');

const { logFields } = fn;
const { rabbit, service } = config;

const initializeRabbit = async () => {
    await menash.connect(rabbit.uri, rabbit.retryOptions);
    await menash.declareQueue(rabbit.matchedRecords);
    await menash.declareQueue(rabbit.afterMerge);
    await menash.declareQueue(rabbit.logQueue);

    await menash.queue(rabbit.matchedRecords).prefetch(rabbit.prefetch);
    await menash.queue(rabbit.matchedRecords).activateConsumer(featureConsumeFunction, { noAck: false });
};

const main = async () => {
    logger.initialize('Traking', 'Merger', 'log-queue', false);
    await initializeMongo();
    logger.info(false, logFields.scopes.system as scopeOption, 'Initialized Mongo', 'Initialized Mongo');
    await initializeRabbit();
    logger.info(false, logFields.scopes.system as scopeOption, 'Initialized Rabbit', 'Initialized Rabbit');

    const server = new Server(service.port);

    await server.start();
    logger.info(false, logFields.scopes.system as scopeOption, 'Initialized Server', 'Start');
    // console.log('start');
};

main().catch((err) => console.error(err)); // change to log
