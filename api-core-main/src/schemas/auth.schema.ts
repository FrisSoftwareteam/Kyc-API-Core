import { object, string, nativeEnum, TypeOf } from 'zod';
import { UserType } from '../constants';

export const userLoginSchema = object({
  body: object({
    email: string({
      required_error: 'Email is required',
    }).trim(),
    password: string({
      required_error: 'Password is required',
    }).trim(),
  }),
});

export type UserLoginInput = TypeOf<typeof userLoginSchema>['body'];

export const forgotPasswordSchema = object({
  body: object({
    email: string({
      required_error: 'Email is required',
    }).trim(),
    dashboardType: nativeEnum(UserType, {
      required_error: 'Dashboard Type is required',
    }),
  }),
});

export type ForgotPasswordInput = TypeOf<typeof forgotPasswordSchema>['body'];

export const resetPasswordSchema = object({
  body: object({
    email: string({
      required_error: 'Email is required',
    }).trim(),
    password: string({
      required_error: 'Password is required',
    }).trim(),
    verificationToken: string({
      required_error: 'Verification Token is required',
    }).trim(),
  }),
});

export type ResetPasswordInput = TypeOf<typeof resetPasswordSchema>['body'];

export const refreshAccessTokenSchema = object({
  body: object({
    userId: string({
      required_error: 'User ID is required',
    }).trim(),
  }),
});

export type RefreshAccessTokenInput = TypeOf<typeof refreshAccessTokenSchema>['body'];
