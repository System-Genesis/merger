/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import menash from 'menashmq';
import Server from './express/server';
import config from './config';
import { initializeMongo, featureConsumeFunction } from './utils/mongoUtils';

const { rabbit, service } = config;

const initializeRabbit = async () => {
    await menash.connect(rabbit.uri, rabbit.retryOptions);
    await menash.declareQueue(rabbit.matchedRecords);
    await menash.declareQueue(rabbit.afterMerge);
    await menash.declareQueue(rabbit.logQueue);

    await menash.queue(rabbit.matchedRecords).activateConsumer(featureConsumeFunction, { noAck: false });
};

const main = async () => {
    await initializeMongo();

    await initializeRabbit();

    const server = new Server(service.port);

    await server.start();
};

main().catch((err) => console.error(err)); // change to log
