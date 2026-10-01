import { Connection, Channel, ConsumeMessage, connect } from 'amqplib';
import { asValue, AwilixContainer } from 'awilix';

import queueConsumers from '../../consumers';

export default async (container: AwilixContainer) => {
  const rabbitMqConfig = container.resolve('config').get('rabbitmq');

  const logger = container.resolve('logger');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rabbitMqConnections: Connection | Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rabbitMqChannels: Channel | Record<string, any> = {};
  let rabbitMqClosing = false;
  let rabbitMqExitOnError = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bindQueue = async (channel: Channel, exchangeName: string, config: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { name, pattern, options }: { name: string; pattern: string; options: any } = config;

    // create a new queue if it doesn't exists
    const q = await channel.assertQueue(name, { durable: true });

    await channel.bindQueue(q.queue, exchangeName, pattern, options);

    if (name in queueConsumers) {
      await queueConsumers[name](container, channel, name);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assertExchange = async (channel: Channel, config: any) => {
    const { type, name, options, queues } = config;

    await channel.assertExchange(name, type, options);

    return Promise.all(
      Object.values(queues).map(async (queueConfig) => bindQueue(channel, name, queueConfig)),
    );
  };

  const tryToConnect = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: any,
    currentRetry = 1,
    waitDelay = 1e3,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> => {
    const { url, name, maxRetries, exchanges } = config;

    let nextRetry = currentRetry + 1;

    try {
      const connection = await connect(url);

      connection.on('error', (error) => {
        logger.error(`rabbitMq received error event for ${name}.`, {
          connectionName: name,
          error,
        });
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      connection.on('close', async (err) => {
        logger.warn(`rabbitMq received close event for ${name}.`, {
          connectionName: name,
        });

        if (!rabbitMqClosing) {
          rabbitMqExitOnError = true;

          await tryToConnect(config, nextRetry);
        }
      });

      const channel = await connection.createChannel();

      await Promise.all(
        Object.values(exchanges).map(async (exchangeConfig) =>
          assertExchange(channel, exchangeConfig),
        ),
      );
      rabbitMqConnections[name] = connection;
      rabbitMqChannels[name] = channel;

      nextRetry = 1;
      logger.info(`rabbitMq connected to ${name}.`);
      return connection;
    } catch (error) {
      if (currentRetry > maxRetries) {
        logger.error(`rabbitMq could not connect to ${name}, max retry count exceeded.`, {
          connectionName: name,
          error,
        });

        if (rabbitMqExitOnError) {
          process.exit(0);
        }

        throw new Error('rabbitMq connection error.');
      }

      logger.error(`rabbitMq could not connect to ${name}.`, {
        connectionName: name,
        error,
      });

      logger.error(JSON.stringify(error));

      await new Promise((resolve) => setTimeout(resolve, waitDelay));

      return tryToConnect(config, nextRetry);
    }
  };

  const publish = async (
    connectionName: string,
    exchangeName: string,
    routeKey: string,
    message: ConsumeMessage,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any,
  ) => {
    if (!(connectionName in rabbitMqChannels)) {
      logger.error(`rabbitMq no connection to ${connectionName}.`, {
        connectionName,
      });

      throw new Error(`rabbitMq no connection to ${connectionName}.`);
    }

    if (!(exchangeName in rabbitMqConfig[connectionName].exchanges)) {
      logger.error(`rabbitMq no exchange for ${exchangeName}.`, {
        exchangeName,
      });

      throw new Error(`rabbitMq no exchange for ${exchangeName}.`);
    }

    try {
      let bufferedMessage;

      if (typeof message === 'string') {
        bufferedMessage = Buffer.from(message);
      } else {
        bufferedMessage = Buffer.from(JSON.stringify(message));
      }

      rabbitMqChannels[connectionName].publish(exchangeName, routeKey, bufferedMessage, options);
    } catch (error) {
      logger.error('rabbitMq could not publish message.', {
        connectionName,
        exchangeName,
        routeKey,
        queueMessage: message,
        options,
        error,
      });

      throw new Error('rabbitMq could not publish message.');
    }
  };

  const start = async () => {
    return Promise.all(
      Object.values(rabbitMqConfig).map(async (connectionConfig) => tryToConnect(connectionConfig)),
    );
  };

  const stop = async () => {
    rabbitMqClosing = true;

    return Promise.all(
      Object.values(rabbitMqConnections).map(async (connection) => connection.close()),
    );
  };

  const register = async () =>
    Promise.all([
      container.register('rabbitMqChannels', asValue(rabbitMqChannels)),
      container.register('rabbitMqPublish', asValue(publish)),
    ]);

  return {
    start,
    stop,
    register,
  };
};
