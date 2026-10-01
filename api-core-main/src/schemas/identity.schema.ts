import { ChargeTypeEnum } from '../models/types/task.type';
import { IIdentityServiceType } from '../models/provider.model';
import { object, string, TypeOf, nativeEnum, ZodIssueCode } from 'zod';

export const validationDataSchema = object({
  firstName: string({
    required_error: 'First Name is required',
  }).trim(),
  lastName: string({
    required_error: 'Last Name is required',
  }).trim(),
  dateOfBirth: string({
    required_error: 'Date of Birth is required',
  }).optional(),
  phoneNumber: string({
    required_error: 'Phone Number is required',
  }).optional(),
  middleName: string({
    required_error: 'Middle Name is required',
  }).optional(),
}).optional();

export type ValidationDataInput = TypeOf<typeof validationDataSchema>;

export const bankStatementSchema = object({
  orderId: string({
    required_error: 'Order ID is required',
  }),
}).optional();

export type BankStatementDataInput = TypeOf<typeof bankStatementSchema>;

export const identityVerificationSchema = object({
  idNumber: string({
    required_error: 'ID Number is required',
  }).trim(),
  type: nativeEnum(IIdentityServiceType, {
    required_error: 'ID Type is required',
  }),
  lastName: string({
    required_error: 'Last Name is required',
  })
    .trim()
    .optional(),
  dateOfBirth: string({
    required_error: 'Date of Birth is required',
  }).optional(),
  validationData: validationDataSchema,
}).optional();

export const identityDataSchema = object({
  businessId: string({
    required_error: 'Business ID is required',
  }).trim(),
  userId: string({
    required_error: 'User ID is required',
  }).trim(),
  id: string({
    required_error: 'ID Number is required',
  }).trim(),
  countryCode: string({
    required_error: 'Country Code is required',
  }).trim(),
});

export type IdentityDataInput = TypeOf<typeof identityDataSchema>;

export const createBvnVerificationSchema = object({
  body: object({
    chargeType: nativeEnum(ChargeTypeEnum, {
      required_error: 'Charge Type is required',
    }),
    card: string({
      required_error: 'Card ID is required When Charge Type is Card',
    })
      .trim()
      .optional(),
    businessId: string({
      required_error: 'Business ID is required',
    }).trim(),
    userId: string({
      required_error: 'User ID is required',
    }).trim(),
    id: string({
      required_error: 'ID Number is required',
    }).trim(),
    countryCode: string({
      required_error: 'Country Code is required',
    }).trim(),
    validationData: validationDataSchema,
  }).superRefine((input, ctx) => {
    if (input.chargeType === ChargeTypeEnum.CARD && input.card === undefined) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'Card ID is required When Charge Type is Card',
        path: ['cardId'],
      });
    }
    return true;
  }),
});

export type CreateBvnVerificationInput = TypeOf<typeof createBvnVerificationSchema>['body'];

export const createNinVerificationSchema = object({
  body: object({
    chargeType: nativeEnum(ChargeTypeEnum, {
      required_error: 'Charge Type is required',
    }),
    card: string({
      required_error: 'Card ID is required When Charge Type is Card',
    })
      .trim()
      .optional(),
    businessId: string({
      required_error: 'Business ID is required',
    }).trim(),
    userId: string({
      required_error: 'User ID is required',
    }).trim(),
    id: string({
      required_error: 'ID Number is required',
    }).trim(),
    countryCode: string({
      required_error: 'Country Code is required',
    }).trim(),
    validationData: validationDataSchema,
  }).superRefine((input, ctx) => {
    if (input.chargeType === ChargeTypeEnum.CARD && input.card === undefined) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'Card ID is required When Charge Type is Card',
        path: ['cardId'],
      });
    }
    return true;
  }),
});

export type CreateNinVerificationInput = TypeOf<typeof createNinVerificationSchema>['body'];

export const createPassportVerificationSchema = object({
  body: object({
    chargeType: nativeEnum(ChargeTypeEnum, {
      required_error: 'Charge Type is required',
    }),
    card: string({
      required_error: 'Card ID is required When Charge Type is Card',
    })
      .trim()
      .optional(),
    businessId: string({
      required_error: 'Business ID is required',
    }).trim(),
    userId: string({
      required_error: 'User ID is required',
    }).trim(),
    id: string({
      required_error: 'ID Number is required',
    }).trim(),
    countryCode: string({
      required_error: 'Country Code is required',
    }).trim(),
    lastName: string({
      required_error: 'Last Name is required',
    }).trim(),
    validationData: validationDataSchema,
  }).superRefine((input, ctx) => {
    if (input.chargeType === ChargeTypeEnum.CARD && input.card === undefined) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'Card ID is required When Charge Type is Card',
        path: ['cardId'],
      });
    }
    return true;
  }),
});

export type CreatePassportVerificationInput = TypeOf<
  typeof createPassportVerificationSchema
>['body'];

export const createDriverLicenseVerificationSchema = object({
  body: object({
    chargeType: nativeEnum(ChargeTypeEnum, {
      required_error: 'Charge Type is required',
    }),
    card: string({
      required_error: 'Card ID is required When Charge Type is Card',
    })
      .trim()
      .optional(),
    businessId: string({
      required_error: 'Business ID is required',
    }).trim(),
    userId: string({
      required_error: 'User ID is required',
    }).trim(),
    id: string({
      required_error: 'ID Number is required',
    }).trim(),
    countryCode: string({
      required_error: 'Country Code is required',
    }).trim(),
    validationData: validationDataSchema,
  }).superRefine((input, ctx) => {
    if (input.chargeType === ChargeTypeEnum.CARD && input.card === undefined) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'Card ID is required When Charge Type is Card',
        path: ['cardId'],
      });
    }
    return true;
  }),
});

export type CreateDriverLicenseVerificationInput = TypeOf<
  typeof createDriverLicenseVerificationSchema
>['body'];

export const createPayArenaOrderSchema = object({
  body: object({
    business: string({
      required_error: 'Business ID is required',
    }).trim(),
    user: string({
      required_error: 'User ID is required',
    }).trim(),
  }),
});

export type CreatePayArenaOrderInput = TypeOf<typeof createPayArenaOrderSchema>['body'];
