import { object, string, TypeOf, number, boolean } from 'zod';

export const createServiceSchema = object({
  body: object({
    name: string({
      required_error: 'Service is required',
    }).trim(),
    provider: string({
      required_error: 'Provider ID is required',
    }).optional(),
    category: string({
      required_error: 'Category ID is required',
    }).optional(),
    price: number({
      required_error: 'Price is required',
    }),
  }),
});

export type CreateServiceInput = TypeOf<typeof createServiceSchema>['body'];

export const updateServiceSchema = object({
  body: object({
    name: string({
      required_error: 'Service is required',
    })
      .trim()
      .optional(),
    price: number({
      required_error: 'Price is required',
    }).optional(),
    active: boolean({
      required_error: 'Active is required',
    }).optional(),
  }),
});

export type UpdateServiceInput = TypeOf<typeof updateServiceSchema>['body'];
