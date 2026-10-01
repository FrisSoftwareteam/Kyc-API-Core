import logger from '../../core/Logger';

const SendVerificationNotificationToAdminEvent = ({ business }: { business: string }) => {
  return { business };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const register = (pubsub: any) => {
  if (!(pubsub && pubsub.on)) return logger.debug('Invalid argument');

  pubsub.on('SendVerificationNotificationToAdminEvent', SendVerificationNotificationToAdminEvent);
};

export default { register };
