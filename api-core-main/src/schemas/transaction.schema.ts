import { object, string, TypeOf, number } from 'zod';

export const createFundWalletPaymentLinkSchema = object({
  body: object({
    amount: number({
      required_error: 'Amount is required',
    }),
    businessId: string({
      required_error: 'Business Id is required',
    }).trim(),
    userId: string({
      required_error: 'User Id is required',
    }).trim(),
    allowedChannel: string({
      required_error: 'Payment Channel is required',
    }).optional(),
  }),
});

export type CreateFundWalletPaymentLinkInput = TypeOf<
  typeof createFundWalletPaymentLinkSchema
>['body'];

export const verifyPaymentSchema = object({
  body: object({
    reference: string({
      required_error: 'Reference is required',
    }).trim(),
  }),
});

export type VerifyPaymentInput = TypeOf<typeof verifyPaymentSchema>['body'];

export const resolveAccountNumberSchema = object({
  body: object({
    accountNumber: string({
      required_error: 'Account Number is required',
    }).trim(),
    bankCode: string({
      required_error: 'Bank Code is required',
    }).trim(),
  }),
});

export type ResolveAccountNumberInput = TypeOf<typeof resolveAccountNumberSchema>['body'];
