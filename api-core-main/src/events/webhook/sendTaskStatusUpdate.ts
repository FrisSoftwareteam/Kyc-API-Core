import axios from 'axios';
import logger from '../../core/Logger';

const sendTaskStatusUpdate = async ({
  url,
  task,
  status,
}: {
  url: string;
  task: Record<string, unknown>;
  status: string;
}) => {
  if (!url || url === '') {
    return false;
  }

  const request = {
    method: 'POST',
    url,
    data: {
      status,
      verificationId: task?._id,
    },
    validateStatus: () => true,
  };

  await axios(request);

  return true;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const register = (pubsub: any) => {
  if (!(pubsub && pubsub.on)) return logger.debug('Invalid argument');

  pubsub.on('sendTaskStatusUpdate', sendTaskStatusUpdate);
};

export default { register };
