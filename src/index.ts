/* eslint-disable no-param-reassign */
/* eslint-disable no-console */

import logger from 'logger-genesis';
import { initializeMongo } from './utils/mongo';
import { scopeOption } from './utils/log';
import fn from './config/fieldNames';
import { initializeRabbit } from './rabbit';

require('dotenv').config();

const { logFields } = fn;

const main = async () => {
    await initializeRabbit();
    logger.info(false, logFields.scopes.system as scopeOption, 'Initialized Rabbit', 'Initialized Rabbit');

    await initializeMongo();
    logger.info(false, logFields.scopes.system as scopeOption, 'Initialized Mongo', 'Initialized Mongo');

    logger.info(false, logFields.scopes.system as scopeOption, 'Initialized Server', 'Start');
};

main().catch((err) => logger.error(false, logFields.scopes.system as scopeOption, 'Traking System Crash', err.message)); // change to log
