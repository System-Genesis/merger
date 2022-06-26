import { initializeMongo } from './mongo/init';
import { activeConsumers, initializeRabbit } from './rabbit/init';
import initLogger from './logger/init';
import * as logs from './logger/logs';

require('dotenv').config();

const main = async () => {
    await initializeMongo();
    console.log('Initialized Rabbit');

    await initializeRabbit();
    await initLogger();
    await activeConsumers();
    logs.initRabbit();

    logs.initServer();
};

main().catch((err) => {
    console.log('Traking System Crash');
    console.log(err.message);
    process.exit();
});
