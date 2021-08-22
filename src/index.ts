/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import initializeMongo from './utils/initializeMongo';
import initializeRabbit from './rabbit';

const main = async () => {
    await initializeMongo();

    await initializeRabbit();

    console.log('start');
};

main().catch((err) => console.error(err)); // change to log
