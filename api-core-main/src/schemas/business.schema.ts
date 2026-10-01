import { object, string, TypeOf, nativeEnum, ZodIssueCode, boolean, number } from 'zod';
import { COUNTRY_CODES } from '../constants';
import { addressSchema } from './address.schema';
import { IIdentityServiceType } from '../models/provider.model';
import { bankStatementSchema, identityVerificationSchema } from './identity.schema';
import {
  documentVerificationSchema,
  academicVerificationSchema,
  // otherVerificationSchema,
  projectVerificationSchema,
  businessPartnershipSchema,
  guarantorVerificationSchema,
  employmentVerificationSchema,
  amlVerificationSchema,
  marriageVerificationSchema,
  criminalVerificationSchema,
  tenancyVerificationSchema,
  businessVerificationSchema,
} from './other-module.schema';
import { ChargeTypeEnum, EntityEnum } from '../models/types/task.type';

export const inviteBusinessSchema = object({
  body: object({
    email: string({
      required_error: 'Email is required',
    }).trim(),
    businessName: string({
      required_error: 'Business Name is required',
    }).trim(),
    address: string({
      required_error: 'Address is required',
    }).trim(),
    cacNumber: string({
      required_error: 'CAC Number is required',
    }).trim(),
    directorNin: string({
      required_error: 'Director NIN is required',
    }).trim(),
    phoneNumber: string({
      required_error: 'Phone Number is required',
    }).trim(),
    industry: string({
      required_error: 'Industry is required',
    }).trim(),
    countryCode: string().refine(
      (inputCountryCode) => Object.values(COUNTRY_CODES).includes(inputCountryCode),
      {
        path: ['countryCode'],
        message: 'Country Code not Supported',
      },
    ),
  }),
});

export type InviteBusinessInput = TypeOf<typeof inviteBusinessSchema>['body'];

export const inviteBusinessUserSchema = object({
  body: object({
    businessId: string({
      required_error: 'Business ID is required',
    }).trim(),
    role: string({
      required_error: 'Role ID is required',
    }).trim(),
    email: string({
      required_error: 'Email is required',
    }).trim(),
    firstName: string({
      required_error: 'First Name is required',
    }).trim(),
    lastName: string({
      required_error: 'Last Name is required',
    }).trim(),
    phoneNumber: object({
      countryCode: string({
        required_error: 'Country code is required',
      }),
      number: string({
        required_error: 'Phone number is required',
      }),
    }),
  }),
});

export type InviteBusinessUserInput = TypeOf<typeof inviteBusinessUserSchema>['body'];

export const completeInviteSignup = object({
  body: object({
    email: string({
      required_error: 'Email is required',
    }).trim(),
    firstName: string({
      required_error: 'First Name is required',
    }).trim(),
    lastName: string({
      required_error: 'Last Name is required',
    }).trim(),
    inviteToken: string({
      required_error: 'Invite Token is required',
    }).trim(),
    password: string({
      required_error: 'Password Token is required',
    }).trim(),
    confirmPassword: string({
      required_error: 'Confirm Password is required',
    }).trim(),
    phoneNumber: object({
      countryCode: string({
        required_error: 'Country code is required',
      }),
      number: string({
        required_error: 'Phone number is required',
      }),
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  }),
});

export type CompleteInviteSignupInput = TypeOf<typeof completeInviteSignup>['body'];

export const reInviteBusinessSchema = object({
  body: object({
    inviteId: string({
      required_error: 'Invite ID is required',
    }).trim(),
    email: string({
      required_error: 'Email is required',
    }).trim(),
  }),
});

export type ReInviteBusinessInput = TypeOf<typeof reInviteBusinessSchema>['body'];

export const updateBusinessSchema = object({
  body: object({
    email: string({
      required_error: 'Email is required',
    })
      .trim()
      .optional(),
    businessName: string({
      required_error: 'Business Name is required',
    })
      .trim()
      .optional(),
    address: string({
      required_error: 'Address is required',
    })
      .trim()
      .optional(),
    industry: string({
      required_error: 'Industry is required',
    })
      .trim()
      .optional(),
    businessPhoneNumber: string({
      required_error: 'Business Phone Number is required',
    })
      .trim()
      .optional(),
    status: boolean({
      required_error: 'Status is required',
    }).optional(),
  }),
});

export type UpdateBusinessInput = TypeOf<typeof updateBusinessSchema>['body'];

export const firstTimeBusinessUserChangePasswordSchema = object({
  body: object({
    oldPassword: string({
      required_error: 'Old Password is required',
    }).trim(),
    password: string({
      required_error: 'Password is required',
    }).trim(),
    confirmPassword: string({
      required_error: 'Confirm Password is required',
    }).trim(),
    businessUserId: string({
      required_error: 'Business User is required',
    }).trim(),
  }).refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  }),
});

export type FirstTimeBusinessUserChangePasswordInput = TypeOf<
  typeof firstTimeBusinessUserChangePasswordSchema
>['body'];

export const createBusinessVerificatonsSchema = object({
  body: object({
    forceCreate: boolean().default(false).optional(),
    chargeType: nativeEnum(ChargeTypeEnum, {
      required_error: 'Charge Type is required',
    }),
    entityType: nativeEnum(EntityEnum, {
      required_error: 'Entity Type is required',
    }).default(EntityEnum.BUSINESS),
    card: string({
      required_error: 'Card ID is required When Charge Type is Card',
    })
      .trim()
      .optional(),
    countryCode: string({
      required_error: 'Country Code is required',
    }).trim(),
    businessId: string({
      required_error: 'Business ID is required',
    }).trim(),
    userId: string({
      required_error: 'User ID is required',
    }).trim(),
    candidateId: string({
      required_error: 'Candidate ID is required',
    }).trim(),
    alias: string({
      required_error: 'Alias is required',
    }).optional(),
    tat: number({
      required_error: 'Turn Around Time is required',
    }).optional(),
    verifications: object({
      identity: identityVerificationSchema,
      address: addressSchema,
      bankStatement: bankStatementSchema,
      documents: documentVerificationSchema,
      academicDocuments: academicVerificationSchema,
      projectVerification: projectVerificationSchema,
      businessPartnership: businessPartnershipSchema,
      guarantorVerification: guarantorVerificationSchema,
      employmentVerification: employmentVerificationSchema,
      aml: amlVerificationSchema,
      marriage: marriageVerificationSchema,
      criminal: criminalVerificationSchema,
      tenancy: tenancyVerificationSchema,
      businessVerification: businessVerificationSchema,
    }),
  }).superRefine((input, ctx) => {
    if (input.chargeType === ChargeTypeEnum.CARD && input.card === undefined) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'Card ID is required When Charge Type is Card',
        path: ['cardId'],
      });
    }
    if (
      input?.verifications?.identity?.type === IIdentityServiceType.PASSPORT &&
      input?.verifications?.identity?.lastName === undefined
    ) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'Last Name is required for International Passport',
        path: ['lastName'],
      });
    }
    return true;
  }),
});

export type CreateBusinessVerificationsInput = TypeOf<
  typeof createBusinessVerificatonsSchema
>['body'];

export const changeBusinesPasswordSchema = object({
  body: object({
    business: string({
      required_error: 'Business ID is required',
    }).trim(),
    user: string({
      required_error: 'User ID is required',
    }).trim(),
    oldPassword: string({
      required_error: 'Address ID is required',
    }).trim(),
    password: string({
      required_error: 'New Password is required',
    }),
    confirmPassword: string({
      required_error: 'Confirm Password is required',
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  }),
});

export type ChangeBusinessPasswordInput = TypeOf<typeof changeBusinesPasswordSchema>['body'];

export const attachRolesSchema = object({
  body: object({
    business: string({
      required_error: 'Business ID is required',
    }).trim(),
    user: string({
      required_error: 'User ID is required',
    }).trim(),
    role: string({
      required_error: 'Role is required',
    }),
  }),
});

export type AttachRolesInput = TypeOf<typeof attachRolesSchema>['body'];

export const suspendUserSchema = object({
  body: object({
    business: string({
      required_error: 'Business ID is required',
    }).trim(),
    user: string({
      required_error: 'User ID is required',
    }).trim(),
  }),
});

export type SuspendUserInput = TypeOf<typeof suspendUserSchema>['body'];

export const restoreUserSchema = object({
  body: object({
    business: string({
      required_error: 'Business ID is required',
    }).trim(),
    user: string({
      required_error: 'User ID is required',
    }).trim(),
  }),
});

export type RestoreUserInput = TypeOf<typeof restoreUserSchema>['body'];

export const uploadBulkIdentitySchema = object({
  body: object({
    forceCreate: boolean().optional().default(false),
    business: string({
      required_error: 'Business ID is required',
    }).trim(),
    user: string({
      required_error: 'User ID is required',
    }).trim(),
    url: string({
      required_error: 'URL is required',
    }).url(),
    entityType: string({
      required_error: 'Entity Type is required',
    }).optional(),
  }),
});

export type UploadBulkIdentityInput = TypeOf<typeof uploadBulkIdentitySchema>['body'];

export const uploadBulkAddressSchema = object({
  body: object({
    forceCreate: boolean().optional().default(false),
    business: string({
      required_error: 'Business ID is required',
    }).trim(),
    user: string({
      required_error: 'User ID is required',
    }).trim(),
    entityType: string({
      required_error: 'Entity Type is required',
    }).optional(),
    url: string({
      required_error: 'URL is required',
    }).url(),
  }),
});

export type UploadBulkAddressInput = TypeOf<typeof uploadBulkAddressSchema>['body'];

export const findBusinessByApiKeySchema = object({
  body: object({
    apiKey: string({
      required_error: 'Api Key is required',
    }).trim(),
  }),
});

export type FindBusinessByApiKeyInput = TypeOf<typeof findBusinessByApiKeySchema>['body'];

export const removeBusinessCardSchema = object({
  body: object({
    card: string({
      required_error: 'Card ID is required',
    }),
    business: string({
      required_error: 'Business ID is required',
    }).trim(),
  }),
});

export type RemoveBusinessCardInput = TypeOf<typeof removeBusinessCardSchema>['body'];

export const taskExistsSchema = object({
  body: object({
    candidate: string({
      required_error: 'Candidate ID is required',
    }),
    business: string({
      required_error: 'Business ID is required',
    }).trim(),
    verifications: string({
      required_error: 'Verification is required',
    }).array(),
  }),
});

export type TaskExistsInput = TypeOf<typeof taskExistsSchema>['body'];

export const submitConsumerIdentitySchema = object({
  body: object({
    type: string({
      required_error: 'ID Type is required',
    }),
    idNumber: string({
      required_error: 'ID Number is required',
    }).trim(),
    firstName: string({
      required_error: 'First Name is required',
    }).trim(),
    lastName: string({
      required_error: 'Last Name is required',
    }).trim(),
    verificationId: string({
      required_error: 'Verification ID is required',
    }).trim(),
  }),
});

export type SubmitConsomerIdentityInput = TypeOf<typeof submitConsumerIdentitySchema>['body'];
