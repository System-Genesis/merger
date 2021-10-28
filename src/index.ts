/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import menash from 'menashmq';
import config from './config';
import { initializeMongo, featureConsumeFunction } from './utils/mongoUtils';

const { rabbit } = config;

const initializeRabbit = async () => {
    await menash.connect(rabbit.uri, rabbit.retryOptions);
    await menash.declareQueue(rabbit.matchedRecords);
    await menash.declareQueue(rabbit.afterMerge);
    await menash.declareQueue(rabbit.logQueue);

    await menash.queue(rabbit.matchedRecords).prefetch(rabbit.prefetch);
    await menash.queue(rabbit.matchedRecords).activateConsumer(featureConsumeFunction, { noAck: false });
};

const main = async () => {
    await initializeMongo();

    await initializeRabbit();

    console.log('start');
};

main().catch((err) => console.error(err)); // change to log
