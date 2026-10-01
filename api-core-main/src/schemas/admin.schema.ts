import { object, string, TypeOf, array, number, boolean, nativeEnum } from 'zod';
import { AdminApprovalStatusEnum } from '../models/types/address.type';

export const createAdminSchema = object({
  body: object({
    firstName: string({
      required_error: 'First Name is required',
    }).trim(),
    lastName: string({
      required_error: 'Last Name is required',
    }).trim(),
    email: string({
      required_error: 'Email is required',
    })
      .email()
      .trim(),
    phoneNumber: object({
      countryCode: string({
        required_error: 'Country code is required',
      }),
      number: string({
        required_error: 'Phone number is required',
      }),
    }),
    countryCode: string({
      required_error: 'Country Code is required',
    }).default('ng'),
    role: string({
      required_error: 'Role is required',
    }).trim(),
  }),
});

export type CreateAdminInput = TypeOf<typeof createAdminSchema>['body'];

export const createBusinessServiceSchema = object({
  body: object({
    business: string({
      required_error: 'Business is required',
    }).trim(),
    services: array(
      object({
        price: number({
          required_error: 'Price is required',
        }),
        service: string({
          required_error: 'Service is required',
        }),
      }),
    ),
  }),
});

export type CreateBusinessServiceInput = TypeOf<typeof createBusinessServiceSchema>['body'];

export const fundBusinessAccountSchema = object({
  body: object({
    business: string({
      required_error: 'Business ID is required',
    }).trim(),
    user: string({
      required_error: 'User ID is required',
    }).trim(),
    amount: number({
      required_error: 'Amount is required',
    }),
  }),
});

export type FundBusinessAccountInput = TypeOf<typeof fundBusinessAccountSchema>['body'];

export const approveAddressSchema = object({
  body: object({
    admin: string({
      required_error: 'Admin is required',
    }).trim(),
    status: nativeEnum(AdminApprovalStatusEnum, {
      required_error: 'Status is required',
    }),
    address: string({
      required_error: 'Address is required',
    }).trim(),
  }),
});

export type ApproveAddressInput = TypeOf<typeof approveAddressSchema>['body'];

export const approveCustomerVerificationSchema = object({
  body: object({
    admin: string({
      required_error: 'Admin is required',
    }).trim(),
    status: boolean({
      required_error: 'Status is required',
    }),
    verificationId: string({
      required_error: 'Verification ID is required',
    }).trim(),
  }),
});

export type ApproveCustomerVerificationInput = TypeOf<
  typeof approveCustomerVerificationSchema
>['body'];

export const approveOtherVerificationSchema = object({
  body: object({
    admin: string({
      required_error: 'Admin is required',
    }).trim(),
    approved: boolean({
      required_error: 'Approved is required',
    }),
    verificationId: string({
      required_error: 'Verification ID is required',
    }).trim(),
  }),
});

export type ApproveOtherVerificationInput = TypeOf<typeof approveOtherVerificationSchema>['body'];

export const unflaggedVerificationSchema = object({
  body: object({
    user: string({
      required_error: 'User ID is required',
    }).trim(),
    address: string({
      required_error: 'Address ID is required',
    }).trim(),
  }),
});

export type UnflaggedVerificationInput = TypeOf<typeof unflaggedVerificationSchema>['body'];

export const rejectVerificationSchema = object({
  body: object({
    user: string({
      required_error: 'User ID is required',
    }).trim(),
    address: string({
      required_error: 'Address ID is required',
    }).trim(),
  }),
});

export type RejectVerificationInput = TypeOf<typeof rejectVerificationSchema>['body'];

export const updateAddressPartnerSchema = object({
  body: object({
    partner: string({
      required_error: 'Partner is required',
    }).trim(),
    address: string({
      required_error: 'Address is required',
    }).trim(),
    agents: string({
      required_error: 'Agent Ids is required',
    })
      .array()
      .optional(),
  }),
});

export type UpdateAddressPartnerInput = TypeOf<typeof updateAddressPartnerSchema>['body'];

export const attachPartnerToAddressesSchema = object({
  body: object({
    user: string({
      required_error: 'User is required',
    }).trim(),
    partner: string({
      required_error: 'Partner is required',
    }).trim(),
    addresses: string({
      required_error: 'Addresses is required',
    }).array(),
    broadcastToAgent: boolean({
      required_error: 'Auto Broadcast To Agent is required',
    }).default(false),
  }),
});

export type AttachPartnerToAddressesInput = TypeOf<typeof attachPartnerToAddressesSchema>['body'];

export const inviteAdminUserSchema = object({
  body: object({
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

export type InviteAdminUserInput = TypeOf<typeof inviteAdminUserSchema>['body'];

export const suspendUserSchema = object({
  body: object({
    user: string({
      required_error: 'User ID is required',
    }).trim(),
  }),
});

export type SuspendUserInput = TypeOf<typeof suspendUserSchema>['body'];

export const restoreUserSchema = object({
  body: object({
    user: string({
      required_error: 'User ID is required',
    }).trim(),
  }),
});

export type RestoreUserInput = TypeOf<typeof restoreUserSchema>['body'];

export const attachRolesSchema = object({
  body: object({
    user: string({
      required_error: 'User ID is required',
    }).trim(),
    role: string({
      required_error: 'Role is required',
    }),
  }),
});

export type AttachRolesInput = TypeOf<typeof attachRolesSchema>['body'];

export const changeAdminPasswordSchema = object({
  body: object({
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

export type ChangeAdminPasswordInput = TypeOf<typeof changeAdminPasswordSchema>['body'];

export const disableBusinessSchema = object({
  body: object({
    business: string({
      required_error: 'Business ID is required',
    }).trim(),
  }),
});

export type DisableBusinessInput = TypeOf<typeof disableBusinessSchema>['body'];

export const disablePartnerSchema = object({
  body: object({
    partner: string({
      required_error: 'Partner ID is required',
    }).trim(),
  }),
});

export type DisablePartnerInput = TypeOf<typeof disablePartnerSchema>['body'];

export const sendTaskToVerifierSchema = object({
  body: object({
    verificationId: string({
      required_error: 'Verification ID is required',
    }).trim(),
    verifier: string({
      required_error: 'Verifier is required',
    }).trim(),
  }),
});

export type SendTaskToVerifierInput = TypeOf<typeof sendTaskToVerifierSchema>['body'];

export const submitVerifierVerificationTaskSchema = object({
  body: object({
    verificationId: string({
      required_error: 'Verification ID is required',
    }).trim(),
    verifier: string({
      required_error: 'Verifier is required',
    }).trim(),
    status: string({
      required_error: 'Status is required',
    }).trim(),
    responseObject: object({}),
  }),
});

export type SubmitVerifierVerificationTaskInput = TypeOf<
  typeof submitVerifierVerificationTaskSchema
>['body'];
