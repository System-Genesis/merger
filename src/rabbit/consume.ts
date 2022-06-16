/* eslint-disable */
import { ConsumerMessage } from 'menashmq';
import { MatchedRecord } from '../types/types';
import { matchedRecordHandler } from '../service/margeHandler';
import * as logs from '../logger/logs';

const DUPLICATE_ERROR_CODE = 11000;

/**
 * runs the function matchedRecordHandler on the received record, tries to insert it into the db, either to insert as new or to update.
 * sometimes when trying to insert multiple records at the same time, we get a db error 11000, and so we try again untill it enters the db.
 * if any other error occurs then stop the function and print the error.
 * @param msg a message sent from basic match, containing a basic matched record
 */
export async function consumeMerger(msg: ConsumerMessage) {
    const matchedRecord: MatchedRecord = msg.getContent() as MatchedRecord;

    while (true) {
        try {
            await matchedRecordHandler(matchedRecord);
        } catch (error: any) {
            if (error.code === DUPLICATE_ERROR_CODE) {
                logs.conflictDB(error);
                console.log('error', error.message);
                continue;
            } else {
                logs.failToAddNewEntity(matchedRecord);
                console.log('error', error.message);
                break;
            }
        }
        break;
    }
    msg.ack();
}
