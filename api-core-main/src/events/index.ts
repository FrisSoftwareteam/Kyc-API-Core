import { EventEmitter } from 'events';
import logger from '../core/Logger';

const pubsub = new EventEmitter();

import SendNotificationToAgentEvent from './notifications/sendNotificationToAgentEvent';
import SendVerificationNotificationToAdminEvent from './notifications/SendVerificationNotificationToAdminEvent';
import sendTaskStatusUpdate from './webhook/sendTaskStatusUpdate';

const handleError = (e: Error) => {
  logger.error('An error has occured', e);
};

const eventHandlers = [
  SendNotificationToAgentEvent,
  sendTaskStatusUpdate,
  SendVerificationNotificationToAdminEvent,
];

eventHandlers.forEach((eventHandler) => {
  try {
    eventHandler.register(pubsub);
  } catch (e) {
    logger.error('An error has occured', e);
  }
});

pubsub.on('error', handleError);

export default pubsub;
