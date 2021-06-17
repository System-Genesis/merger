/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import menash from 'menashmq';
import Server from './express/server';
import config from './config';
import { generateConstPersons } from './utils/mocksGenerator';
import { initializeMongo, featureConsumeFunction } from './utils/mongoUtils';

const { rabbit, service } = config;

const initializeRabbit = async () => {
    console.log('Connecting to Rabbit...');

    await menash.connect(rabbit.uri, rabbit.retryOptions);
    await menash.declareQueue(rabbit.matchedRecords);
    console.log('Rabbit connected');

    await menash.queue(rabbit.matchedRecords).activateConsumer(featureConsumeFunction, { noAck: false });

    // await menash.declareTopology({
    //     queues: [{ name: 'feature-queue', options: { durable: true } }],
    //     exchanges: [{ name: 'feature-exchange', type: 'fanout', options: { durable: true } }],
    //     bindings: [{ source: 'feature-exchange', destination: 'feature-queue' }],
    //     consumers: [{ queueName: 'feature-queue', onMessage: featureConsumeFunction }],
    // });

    console.log('Rabbit initialized');
};

const main = async () => {
    await initializeMongo();

    generateConstPersons();

    await initializeRabbit();

    const server = new Server(service.port);

    await server.start();

    console.log(`Server started on port: ${service.port}`);
};

main().catch((err) => console.error(err));
