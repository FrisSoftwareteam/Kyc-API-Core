import { object, string, TypeOf, nativeEnum, ZodIssueCode, boolean, number } from 'zod';
import { COUNTRY_CODES } from '../constants';
import { AgentStatus } from '../models/types/agent.type';

export const invitePartnerSchema = object({
  body: object({
    email: string({
      required_error: 'Email is required',
    }).trim(),
    partnerName: string({
      required_error: 'Partner Name is required',
    }).trim(),
    address: string({
      required_error: 'Address is required',
    }).trim(),
    phoneNumber: string({
      required_error: 'Phone Number is required',
    }).trim(),
    cacNumber: string({
      required_error: 'CAC Number is required',
    }).trim(),
    directorNin: string({
      required_error: 'Director NIN is required',
    }).trim(),
    states: string({
      required_error: 'States is required',
    }).array(),
    settings: object({}).optional(),
    countryCode: string().refine(
      (inputCountryCode) => Object.values(COUNTRY_CODES).includes(inputCountryCode),
      {
        path: ['countryCode'],
        message: 'Country Code not Supported',
      },
    ),
  }),
});

export type InvitePartnerInput = TypeOf<typeof invitePartnerSchema>['body'];

export const invitePartnerUserSchema = object({
  body: object({
    partnerId: string({
      required_error: 'Partner ID is required',
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

export type InvitePartnerUserInput = TypeOf<typeof invitePartnerUserSchema>['body'];

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

export const reInvitePartnerSchema = object({
  body: object({
    inviteId: string({
      required_error: 'Invite ID is required',
    }).trim(),
    email: string({
      required_error: 'Email is required',
    }).trim(),
  }),
});

export type ReInvitePartnerInput = TypeOf<typeof reInvitePartnerSchema>['body'];

export const updatePartnerSchema = object({
  body: object({
    email: string({
      required_error: 'Email is required',
    })
      .trim()
      .optional(),
    partnerName: string({
      required_error: 'Partner Name is required',
    })
      .trim()
      .optional(),
    address: string({
      required_error: 'Address is required',
    })
      .trim()
      .optional(),
    phoneNumber: string({
      required_error: 'Phone Number is required',
    })
      .trim()
      .optional(),
    active: boolean({
      required_error: 'Active is required',
    }).optional(),
    settings: object({}).optional(),
    states: string({
      required_error: 'States is required',
    }).array(),
    prices: object({
      address: object({
        partner: object({
          lagos: number({
            required_error: 'Lagos is required',
          }),
          others: number({
            required_error: 'Other State is required',
          }),
        }),
        agent: object({
          lagos: number({
            required_error: 'Lagos is required',
          }),
          others: number({
            required_error: 'Other State is required',
          }),
        }),
      }),
    }).optional(),
  }),
});

export type UpdatePartnerInput = TypeOf<typeof updatePartnerSchema>['body'];

export const firstTimePartnerUserChangePasswordSchema = object({
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
    partnerUserId: string({
      required_error: 'User Invite is required',
    }).trim(),
  }).refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  }),
});

export type FirstTimePartnerUserChangePasswordInput = TypeOf<
  typeof firstTimePartnerUserChangePasswordSchema
>['body'];

export const reAssignTaskSchema = object({
  body: object({
    agent: string({
      required_error: 'Agent ID is required',
    }).trim(),
    task: string({
      required_error: 'Task ID is required',
    }).trim(),
  }),
});

export type ReAssignTaskInput = TypeOf<typeof reAssignTaskSchema>['body'];

export const reAssignAllTaskSchema = object({
  body: object({
    state: string({
      required_error: 'State is required',
    }).optional(),
    tasks: string({
      required_error: 'Task IDs is required',
    })
      .array()
      .optional(),
  }).superRefine((input, ctx) => {
    if (!input?.tasks?.length && input.state === undefined) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'Either tasks ID or State or both Must be sent',
        path: ['tasks'],
      });
    }
    return true;
  }),
});

export type ReAssignTaskAllInput = TypeOf<typeof reAssignAllTaskSchema>['body'];

export const updatePartnerAgentSchema = object({
  body: object({
    firstName: string({
      required_error: 'First Name is required',
    })
      .trim()
      .optional(),
    lastName: string({
      required_error: 'Partner Name is required',
    })
      .trim()
      .optional(),
    email: string({
      required_error: 'Email is required',
    })
      .trim()
      .optional(),
    agent: string({
      required_error: 'Agent is required',
    }).trim(),
    partner: string({
      required_error: 'Partner is required',
    }).trim(),
    status: nativeEnum(AgentStatus, {
      required_error: 'Agent Status is required',
    }).optional(),
  }),
});

export type UpdatePartnerAgentInput = TypeOf<typeof updatePartnerAgentSchema>['body'];

export const changePasswordSchema = object({
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
    userId: string({
      required_error: 'User ID is required',
    }).trim(),
  }).refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  }),
});

export type ChangePasswordInput = TypeOf<typeof changePasswordSchema>['body'];

export const attachRolesSchema = object({
  body: object({
    partner: string({
      required_error: 'Partner ID is required',
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
    partner: string({
      required_error: 'Partner ID is required',
    }).trim(),
    user: string({
      required_error: 'User ID is required',
    }).trim(),
  }),
});

export type SuspendUserInput = TypeOf<typeof suspendUserSchema>['body'];

export const restoreUserSchema = object({
  body: object({
    partner: string({
      required_error: 'Partner ID is required',
    }).trim(),
    user: string({
      required_error: 'User ID is required',
    }).trim(),
  }),
});

export type RestoreUserInput = TypeOf<typeof restoreUserSchema>['body'];

export const suspendAgentSchema = object({
  body: object({
    partner: string({
      required_error: 'Partner ID is required',
    }).trim(),
    agent: string({
      required_error: 'Agent ID is required',
    }).trim(),
  }),
});

export type SuspendAgentInput = TypeOf<typeof suspendAgentSchema>['body'];

export const restoreAgentSchema = object({
  body: object({
    partner: string({
      required_error: 'Partner ID is required',
    }).trim(),
    agent: string({
      required_error: 'Agent ID is required',
    }).trim(),
  }),
});

export type RestoreAgentInput = TypeOf<typeof restoreAgentSchema>['body'];

export const unflaggedVerificationSchema = object({
  body: object({
    partner: string({
      required_error: 'Partner ID is required',
    }).trim(),
    user: string({
      required_error: 'User ID is required',
    }).trim(),
    task: string({
      required_error: 'Task ID is required',
    }).trim(),
  }),
});

export type UnflaggedVerificationInput = TypeOf<typeof unflaggedVerificationSchema>['body'];

export const withdrawPartnerFundSchema = object({
  body: object({
    partner: string({
      required_error: 'Partner is required',
    }).trim(),
    amount: number({
      required_error: 'Amount is required',
    }),
  }),
});

export type WithdrawPartnerFundInput = TypeOf<typeof withdrawPartnerFundSchema>['body'];

export const upsertBankSchema = object({
  body: object({
    partner: string({
      required_error: 'Partner is required',
    }).trim(),
    accountNumber: string({
      required_error: 'Account Number is required',
    }).trim(),
    bankCode: number({
      required_error: 'Bank Code is required',
    }),
  }),
});

export type UpsertBankInput = TypeOf<typeof upsertBankSchema>['body'];
