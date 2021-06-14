import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asUrlString(),
        featureCollectionName: env.get('MONGO_FEATURE_COLLECTION_NAME').required().asString(),
        dataCollectionName: env.get('DATA_COLLECTION_NAME').required().asString(),
        eventsCollectionName: env.get('EVENTS_COLLECTION_NAME').required().asString(),
    },
    rabbit: {
        uri: env.get('RABBIT_URI').required().asUrlString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        beforeMerge: env.get('CONSUME_QUEUE').required().asString(),
    },
};

export default config;
