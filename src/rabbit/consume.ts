/* eslint-disable */
import { ConsumerMessage } from 'menashmq';
import logger, { scopeOption } from 'logger-genesis';
import { MatchedRecord } from '../types/types';
import { getIdentifiers, getFirstIdentifier } from '../utils/identifiersUtils';
import { matchedRecordHandler } from '../utils/margeHndler';
import fn from '../config/fieldNames';

const { logFields } = fn;

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
            if (error.code === 11000) {
                logger.error(true, logFields.scopes.app as scopeOption, 'Parallel insert conflict', error.message);
                console.log('error', error.message);
                continue;
            } else {
                logger.error(
                    false,
                    logFields.scopes.app as scopeOption,
                    'Error inserting person',
                    `identifiers: ${JSON.stringify(getIdentifiers(matchedRecord.record))}, Source: ${matchedRecord.dataSource}`,
                    {
                        id: getFirstIdentifier(getIdentifiers(matchedRecord.record)),
                        uniqueId: matchedRecord.record.userID,
                        source: matchedRecord.dataSource,
                    },
                );
                console.log('error', error.message);
                break;
            }
        }
        break;
    }
    msg.ack();
}
