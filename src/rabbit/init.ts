import menash from 'menashmq';
import initLogger from '../logger';
import { consumeMerger } from './consume';
import config from '../config';
import { MergedOBJ } from '../types/types';

const { rabbit } = config;
export const initializeRabbit = async () => {
    await menash.connect(rabbit.uri, rabbit.retryOptions);
    await menash.declareQueue(rabbit.matchedRecords, { durable: true });
    await menash.declareQueue(rabbit.afterMerge, { durable: true });

    await initLogger();
    await menash.queue(rabbit.matchedRecords).prefetch(rabbit.prefetch);
    await menash.queue(rabbit.matchedRecords).activateConsumer(consumeMerger, { noAck: false });
};

export async function sendToQueue(mergedRecord: MergedOBJ) {
    await menash.send(config.rabbit.afterMerge, mergedRecord, { persistent: true });
}
