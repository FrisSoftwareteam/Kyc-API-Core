import logger from '../../core/Logger';
import { sendFcmPushNotfication } from '../../utils/fcm.notification';
import { publishNotificationToAgent } from '../../utils/ably.notification';
import { TURNAROUND_TIME } from '../../constants';

const sendAgentNotificationToFcm = ({
  notificationObject,
  index,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notificationObject: any;
  index: number;
}) => {
  const candidateFirstName = notificationObject?.body.candidate?.firstName;
  const candidateLastName = notificationObject?.body.candidate?.lastName;
  const candidatePhoneNumber = notificationObject?.body.candidate?.phoneNumber;

  sendFcmPushNotfication({
    notification: {
      body: notificationObject.title as string,
      title: `${candidateFirstName} ${candidateLastName}`,
    },
    tokens: notificationObject.agents[index].fcmTokens,
    data: {
      verificationId: String(notificationObject?.body.verificationId),
      addressId: String(notificationObject?.body.addressId),
      address: notificationObject?.body.address || '',
      landmark: notificationObject?.body?.landmark ?? '',
      turnarroundTime: ['lagos', 'lagos state'].includes(
        notificationObject?.body?.address?.details?.state || '',
      )
        ? TURNAROUND_TIME.lagos
        : TURNAROUND_TIME.others,
      ...(notificationObject.agents[index]?.distance
        ? { distance: String(notificationObject.agents[index]?.distance) }
        : undefined),
      ...(notificationObject.agents[index]?.price
        ? { price: String(notificationObject.agents[index]?.price) }
        : undefined),
      ...(notificationObject?.body.candidate?.firstName
        ? { candidateFirstName: candidateFirstName }
        : undefined),
      ...(notificationObject?.body.candidate?.lastName
        ? { candidateLastName: candidateLastName }
        : undefined),
      ...(notificationObject?.body.candidate?.phoneNumber
        ? { candidatePhoneNumber: candidatePhoneNumber }
        : undefined),
    },
  });
};

export const sendAgentNotificationToAbly = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AblyClient: any,
  {
    notificationObject,
    index,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notificationObject: any;
    index: number;
  },
) => {
  publishNotificationToAgent(AblyClient, notificationObject.agents[index].eventId, {
    ...notificationObject.body,
    landmark: notificationObject?.body?.landmark ?? '',
    distance: notificationObject.agents[index]?.distance,
    price: notificationObject.agents[index]?.price,
    turnarroundTime:
      notificationObject?.tat ??
      ['lagos', 'lagos state'].includes(notificationObject?.body?.address?.details?.state || '')
        ? TURNAROUND_TIME.lagos
        : TURNAROUND_TIME.others,
  });
};

const sendNotificationToAgent = ({
  AblyClient,
  notificationObject,
  index,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AblyClient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notificationObject: any;
  index: number;
}) => {
  if (notificationObject.agents[index].fcmTokens.length > 0) {
    sendAgentNotificationToFcm({
      notificationObject,
      index,
    });
  }

  if (notificationObject?.agents[index]?.eventId) {
    sendAgentNotificationToAbly(AblyClient, {
      notificationObject,
      index,
    });
  }

  return { notificationObject, index };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const register = (pubsub: any) => {
  if (!(pubsub && pubsub.on)) return logger.debug('Invalid argument');

  pubsub.on('sendNotificationToAgent', sendNotificationToAgent);
};

export default { register };
