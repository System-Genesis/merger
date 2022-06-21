import menash from 'menashmq';
import { consumeMerger } from './consume';
import config from '../config';
import { MergedOBJ } from '../types/types';

const { rabbit } = config;

export const initializeRabbit = async () => {
    await menash.connect(rabbit.uri, rabbit.retryOptions);

    await menash.declareQueue(rabbit.matchedRecords, { durable: true });
    await menash.declareQueue(rabbit.afterMerge, { durable: true });

    await menash.queue(rabbit.matchedRecords).prefetch(rabbit.prefetch);
};

export async function sendToQueue(mergedRecord: MergedOBJ) {
    // TODO log
    await menash.send(config.rabbit.afterMerge, mergedRecord, { persistent: true });
}

export const activeConsumers = async () => {
    await menash.queue(rabbit.matchedRecords).activateConsumer(consumeMerger, { noAck: false });
};
