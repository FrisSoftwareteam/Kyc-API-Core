import { object, string, TypeOf } from 'zod';

export const categorySchema = object({
  body: object({
    name: string({
      required_error: 'category is required',
    }).trim(),
  }),
});

export type CategoryInput = TypeOf<typeof categorySchema>['body'];

export const updateCategorySchema = object({
  body: object({
    name: string({
      required_error: 'category is required',
    }).trim(),
  }),
});

export type UpdateCategoryInput = TypeOf<typeof updateCategorySchema>['body'];
