import { NotFoundError } from '../errors/api.error';
import NotificationFormatter, {
  INotificationFormatter,
} from '../formatters/notification.formatter';

export default class NotificationService {
  private readonly config;
  private readonly NotificationDataAccess;

  constructor({
    config,
    NotificationDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.NotificationDataAccess = NotificationDataAccess;
  }

  async fetchAll(
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; notification: INotificationFormatter[] }> {
    const { NotificationDataAccess } = this;
    const { status } = query;

    const notification = await NotificationDataAccess.all({ status });

    return notification?.map((notification: Record<string, unknown>) =>
      NotificationFormatter({ notification }),
    );
  }

  async fetchById(notificationId: string): Promise<INotificationFormatter | Error> {
    const { NotificationDataAccess } = this;

    const notification = await NotificationDataAccess.fetchById(notificationId);

    if (!notification) {
      throw new NotFoundError('notification not found', { code: 'NOTIFICATION_NOT_FOUND' });
    }

    return NotificationFormatter({ notification });
  }

  async fetchAdminNotifications(
    query: Record<string, unknown>,
  ): Promise<INotificationFormatter | Error> {
    const { NotificationDataAccess } = this;

    const { limit = 10 } = query;

    const notifications = await NotificationDataAccess.allAdmin({ limit });

    return notifications.map((notification: Record<string, unknown>) =>
      NotificationFormatter({ notification }),
    );
  }

  async fetchModelNotificationsByModelId(
    params: Record<string, unknown>,
    query: Record<string, unknown>,
  ): Promise<INotificationFormatter | Error> {
    const { NotificationDataAccess } = this;

    const { modelId, type: modelType } = params;
    const { limit = 10 } = query;

    const notifications = await NotificationDataAccess.allByModel({ modelId, modelType, limit });

    return notifications.map((notification: Record<string, unknown>) =>
      NotificationFormatter({ notification }),
    );
  }

  async markAsRead(payload: Record<string, unknown>): Promise<string> {
    const { NotificationDataAccess } = this;

    await NotificationDataAccess.markAsRead(payload.ids, { isRead: true });

    return 'Mark as read successfully';
  }
}
