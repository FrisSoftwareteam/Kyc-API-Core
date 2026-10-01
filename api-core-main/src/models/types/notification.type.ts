import User from '../user.model';
export interface INotification {
  actor: typeof User;
  text: string;
  title: string;
  modelId: string;
  modelType: string;
  isRead: boolean;
}
