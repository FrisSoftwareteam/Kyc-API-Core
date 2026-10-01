import { UploadBulkIdentityInput } from '../schemas/business.schema';
import { ReAssignTaskAllInput } from '../schemas/partner.schema';

export default class RabbitMqService {
  private readonly logger;
  private readonly config;
  private readonly rabbitMqPublish;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ logger, config, rabbitMqPublish }: any) {
    this.logger = logger;
    this.config = config;

    this.rabbitMqPublish = rabbitMqPublish;
  }

  async publish({
    connectionName,
    exchangeName,
    pattern,
    message,
  }: {
    connectionName: string;
    exchangeName: string;
    pattern: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: any;
  }) {
    const { rabbitMqPublish, logger } = this;

    return (
      rabbitMqPublish(connectionName, exchangeName, pattern, message)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch(async (error: any) => {
          logger.error('rabbitMq could not publish message.', {
            connectionName,
            exchangeName,
            queueMessage: message,
            error,
          });
        })
    );
  }

  async publishToBulkIdentityUploadQueue(message: UploadBulkIdentityInput) {
    const { config } = this;

    const { name, exchanges } = config.get('rabbitmq').firstcheck;

    const connectionName = name;
    const exchangeName = exchanges.firstcheck.name;
    const { pattern } = exchanges.firstcheck.queues.BULK_IDENTITY_UPLOAD;

    return this.publish({
      connectionName,
      exchangeName,
      pattern,
      message,
    });
  }

  async publishToBulkAddressUploadQueue(message: UploadBulkIdentityInput) {
    const { config } = this;

    const { name, exchanges } = config.get('rabbitmq').firstcheck;

    const connectionName = name;
    const exchangeName = exchanges.firstcheck.name;
    const { pattern } = exchanges.firstcheck.queues.BULK_ADDRESS_UPLOAD;

    return this.publish({
      connectionName,
      exchangeName,
      pattern,
      message,
    });
  }

  async publishToTaskBroadcastQueue(message: ReAssignTaskAllInput) {
    const { config } = this;

    const { name, exchanges } = config.get('rabbitmq').firstcheck;

    const connectionName = name;
    const exchangeName = exchanges.firstcheck.name;
    const { pattern } = exchanges.firstcheck.queues.BROADCAST_ADDRESS;

    return this.publish({
      connectionName,
      exchangeName,
      pattern,
      message,
    });
  }

  async publishToExportAddressQueue(message: Record<string, unknown>) {
    const { config } = this;

    const { name, exchanges } = config.get('rabbitmq').firstcheck;

    const connectionName = name;
    const exchangeName = exchanges.firstcheck.name;
    const { pattern } = exchanges.firstcheck.queues.EXPORT_ADDRESS;

    return this.publish({
      connectionName,
      exchangeName,
      pattern,
      message,
    });
  }

  async publishToExportVerificationQueue(message: Record<string, unknown>) {
    const { config } = this;

    const { name, exchanges } = config.get('rabbitmq').firstcheck;

    const connectionName = name;
    const exchangeName = exchanges.firstcheck.name;
    const { pattern } = exchanges.firstcheck.queues.ADMIN_VERIFICATION;

    return this.publish({
      connectionName,
      exchangeName,
      pattern,
      message,
    });
  }
}
