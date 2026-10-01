import logger from '../core/Logger';
import { ABLY_ADMIN_EVENT_ID, ABLY_ADMIN_CHANNEL } from '../constants';
import { AgentNotificationPayload } from '../constants';

export const publishNotificationToAgent = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AblyClient: any,
  eventId: string,
  message: Record<string, unknown>,
) => {
  try {
    logger.info(`Sending notification to firstCheckAgent-${eventId}`);

    const channel = await AblyClient.channels.get(`firstCheckAgent-${String(eventId)}`);

    await channel.publish(AgentNotificationPayload.AblyAddressEventName, message);

    logger.info(`Notification sent to firstCheckAgent-${String(eventId)}`);

    return;
  } catch (err) {
    logger.error(
      JSON.stringify({
        error: JSON.stringify(err),
        message: 'Ably Notification not sent',
      }),
    );
  }
};

export const publishAblyNotificationToAdmin = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AblyClient: any,
  message: Record<string, unknown>,
) => {
  try {
    logger.info(`Sending notification to ${ABLY_ADMIN_EVENT_ID}`);

    const channel = await AblyClient.channels.get(ABLY_ADMIN_CHANNEL);

    await channel.publish(ABLY_ADMIN_EVENT_ID, message);

    logger.info(`Notification sent to ${ABLY_ADMIN_EVENT_ID}`);

    return;
  } catch (err) {
    logger.error(
      JSON.stringify({
        error: JSON.stringify(err),
        message: 'Ably Notification not sent',
      }),
    );
  }
};
