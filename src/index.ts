/* eslint-disable no-param-reassign */
/* eslint-disable no-console */

import logger, { scopeOption } from 'logger-genesis';
import { initializeMongo } from './utils/mongo';
import fn from './config/fieldNames';
import { initializeRabbit } from './rabbit/init';

require('dotenv').config();

const { logFields } = fn;

const main = async () => {
    await initializeRabbit();
    logger?.info(false, logFields.scopes.system as scopeOption, 'Initialized Rabbit', 'Initialized Rabbit');

    await initializeMongo();
    logger?.info(false, logFields.scopes.system as scopeOption, 'Initialized Mongo', 'Initialized Mongo');

    logger?.info(false, logFields.scopes.system as scopeOption, 'Initialized Server', 'Start');
};

main().catch((err) => logger.error(false, logFields.scopes.system as scopeOption, 'Traking System Crash', err.message)); // change to log
