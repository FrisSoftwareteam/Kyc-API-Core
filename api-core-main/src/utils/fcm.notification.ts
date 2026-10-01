// import firebaseAdmin from 'firebase-admin';
import { initializeApp, ServiceAccount, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import logger from '../core/Logger';

import firebaseAccountCredentials from '../privatekeys/firebase.json';

const serviceAccount = firebaseAccountCredentials as ServiceAccount;
export interface ISendNotificationRequest {
  notification: {
    title: string;
    body: string;
  };
  tokens: string[];
  data: {
    [key: string]: string;
  };
}

initializeApp({
  credential: cert(serviceAccount),
});

export const sendFcmPushNotfication = async (payload: ISendNotificationRequest) => {
  try {
    logger.http('Sending FCM notification');

    await getMessaging().sendEachForMulticast({
      notification: payload.notification,
      tokens: payload.tokens,
      data: payload.data,
    });

    logger.info(`FCM Notification Sent`);
    return;
  } catch (err) {
    logger.error(
      JSON.stringify({
        error: JSON.stringify(err),
        message: 'Fcm Notification not sent',
      }),
    );
  }
};
