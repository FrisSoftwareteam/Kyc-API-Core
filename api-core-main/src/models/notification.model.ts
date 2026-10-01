import { Schema } from 'mongoose';
import { INotification } from './types/notification.type';

const NotificationSchema = new Schema<INotification>(
  {
    actor: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    text: { type: String, required: true },
    title: { type: String, required: true },
    modelId: { type: String, required: false },
    modelType: { type: String, required: true },
    isRead: { type: Boolean, required: true },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Notifications', NotificationSchema);
};
