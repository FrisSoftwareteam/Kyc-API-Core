import { once } from '../utils/promise';
import DatabaseComponent from '../bootstrap/modules/mongoose';
import AblyComponent from '../bootstrap/modules/ably';
import RedisComponent from '../bootstrap/modules/redis';
import RabbitMqComponent from '../bootstrap/modules/rabbitmq';
import ServerComponent from './server';
import container from '../bootstrap/container';
import { bootstrapWithContainer } from '../bootstrap/utils';

const main = async () => {
  const componentsToBootstrap = {
    Redis: RedisComponent,
    Mongoose: DatabaseComponent,
    Ably: AblyComponent,
    RabbitMq: RabbitMqComponent,

    // last to initialize is server
    Server: ServerComponent,
  };

  const stop = await bootstrapWithContainer(container.createScope(), componentsToBootstrap);
  const stopOnce = once(stop);

  process.on('SIGTERM', stopOnce);
  process.on('SIGINT', stopOnce);
};

// eslint-disable-next-line no-console
main().catch(console.log);
