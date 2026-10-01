import { object, string, TypeOf } from 'zod';

export const notificationSchema = object({
  body: object({
    title: string({
      required_error: 'you have a new message',
    }).trim(),
  }),

  userId: string({
    required_error: 'notification id ',
  }).trim(),

  text: string({
    required_error: 'notification  ',
  }).trim(),
});

export type notificationInput = TypeOf<typeof notificationSchema>['body'];
