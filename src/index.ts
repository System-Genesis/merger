/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import menash from 'menashmq';
import Server from './express/server';
import config from './config';
import { initializeMongo, featureConsumeFunction } from './utils/mongoUtils';

const { rabbit, service } = config;

const initializeRabbit = async () => {
    console.log('Connecting to Rabbit...');

    await menash.connect(rabbit.uri, rabbit.retryOptions);
    await menash.declareQueue(rabbit.matchedRecords);
    await menash.declareQueue(rabbit.afterMerge);
    await menash.declareQueue(rabbit.logQueue);
    console.log('Rabbit connected');

    await menash.queue(rabbit.matchedRecords).activateConsumer(featureConsumeFunction, { noAck: false });

    console.log('Rabbit initialized');
};

const main = async () => {
    await initializeMongo();

    await initializeRabbit();

    const server = new Server(service.port);

    await server.start();

    console.log(`Server started on port: ${service.port}`);
};

main().catch((err) => console.error(err));
