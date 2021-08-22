import menash, { ConsumerMessage } from 'menashmq';
import config from './config';
import { MatchedRecord, MergedOBJ } from './utils/types';
import { matchedRecordHandler } from './utils/mongoUtils';

const { rabbit } = config;

export const sendToQueue = async (mergedRecord: MergedOBJ) => {
    await menash.send(config.rabbit.afterMerge, mergedRecord);
};

export async function featureConsumeFunction(msg: ConsumerMessage) {
    try {
        const matchedRecord: MatchedRecord = msg.getContent() as MatchedRecord;
        await matchedRecordHandler(matchedRecord);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log('error', error.message);
    }

    msg.ack();
}

const initializeRabbit = async () => {
    await menash.connect(rabbit.uri, rabbit.retryOptions);
    await menash.declareQueue(rabbit.matchedRecords);
    await menash.declareQueue(rabbit.afterMerge);
    await menash.declareQueue(rabbit.logQueue);

    await menash.queue(rabbit.matchedRecords).prefetch(1);
    await menash.queue(rabbit.matchedRecords).activateConsumer(featureConsumeFunction, { noAck: false });
};

export default initializeRabbit;
