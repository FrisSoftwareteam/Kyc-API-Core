import { object, string, TypeOf, array, boolean, nativeEnum, number } from 'zod';
import { IIdentityServiceType } from '../models/provider.model';

export const verificationsSchema = object({
  serviceType: nativeEnum(IIdentityServiceType, {
    required_error: 'Service Type is required',
  }),
  order: number({
    required_error: 'Order Number is required',
  }),
});

export type VerificationInput = TypeOf<typeof verificationsSchema>;

export const createBundleSchema = object({
  body: object({
    name: string({
      required_error: 'Name is required',
    }).trim(),
    default: boolean({
      required_error: 'Default is required',
    }).optional(),
    price: number({
      required_error: 'Price is required',
    }),
    verifications: array(verificationsSchema),
  }),
});

export type CreateBundleInput = TypeOf<typeof createBundleSchema>['body'];
