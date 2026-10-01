import { object, string, TypeOf, number, boolean } from 'zod';

export const createProviderSchema = object({
  body: object({
    name: string({
      required_error: 'Provider is required',
    }).trim(),
    prices: object({}),
    service: string({
      required_error: 'Service is required',
    }).trim(),
  }),
});

export type CreateProviderInput = TypeOf<typeof createProviderSchema>['body'];

export const updateProviderSchema = object({
  body: object({
    name: string({
      required_error: 'Provider is required',
    })
      .trim()
      .optional(),
    price: number({
      required_error: 'Price is required',
    }).optional(),
    service: number({
      required_error: 'Service is required',
    }).optional(),
    active: boolean({
      required_error: 'Active is required',
    }).optional(),
  }),
});

export type UpdateProviderInput = TypeOf<typeof updateProviderSchema>['body'];

export const setProviderSchema = object({
  body: object({
    provider: string({
      required_error: 'Provider is required',
    }).trim(),
    type: string({
      required_error: 'Type is required',
    }).trim(),
  }),
});

export type SetProviderInput = TypeOf<typeof setProviderSchema>['body'];
