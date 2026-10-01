export interface INotificationFormatter {
  _id: string;
  text: string;
  title: string;
  isRead: boolean;
  createdAt: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ notification }: any): INotificationFormatter => {
  return {
    _id: notification?._id,
    text: notification?.text,
    title: notification?.title,
    isRead: notification?.isRead,
    createdAt: notification?.createdAt,
  };
};
