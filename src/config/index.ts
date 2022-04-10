import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        name: env.get('SERVICE_NAME').required().asString(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asString(),
        featureCollectionName: env.get('MONGO_FEATURE_COLLECTION_NAME').required().asString(),
        dataCollectionName: env.get('DATA_COLLECTION_NAME').required().asString(),
    },
    rabbit: {
        uri: env.get('RABBIT_URI').required().asUrlString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
        matchedRecords: env.get('CONSUME_QUEUE').required().asString(),
        afterMerge: env.get('PRODUCE_QUEUE').required().asString(),
        logQueue: env.get('LOG_QUEUE').required().asString(),
        prefetch: env.get('PREFETCH').required().default(100).asIntPositive(),
    },
    systemName: env.get('SYSTEM_NAME').required().asString(),
};

export default config;
