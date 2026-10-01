import { object, string, TypeOf, number, nativeEnum, boolean } from 'zod';
import { AgentOnlineStatus } from '../models/types/agent.type';
import { AgentStatusUpdateEnum, AgentSubmitStatusUpdateEnum } from '../models/types/address.type';

export enum AcceptTaskEnum {
  ACCEPT = 'accept',
  DECLINE = 'decline',
}

export const inviteAgentSchema = object({
  body: object({
    partner: string({
      required_error: 'Partner is required',
    }).trim(),
    email: string({
      required_error: 'Email is required',
    }).trim(),
  }),
});

export type InviteAgentInput = TypeOf<typeof inviteAgentSchema>['body'];

export const completeAgentSignupSchema = object({
  body: object({
    partner: string({
      required_error: 'Partner is required',
    }).trim(),
    inviteToken: string({
      required_error: 'Invite Token is required',
    }).trim(),
    email: string({
      required_error: 'Email is required',
    }).trim(),
    lastName: string({
      required_error: 'Last Name is required',
    }).trim(),
    firstName: string({
      required_error: 'First Name is required',
    }).trim(),
    phoneNumber: object({
      countryCode: string({
        required_error: 'Country code is required',
      }),
      number: string({
        required_error: 'Phone number is required',
      }),
    }),
    password: string({
      required_error: 'Password Token is required',
    }).trim(),
    confirmPassword: string({
      required_error: 'Confirm Password is required',
    }).trim(),
  }).refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  }),
});

export type CompleteAgentSignupInput = TypeOf<typeof completeAgentSignupSchema>['body'];

export const syncAgentLocatonSchema = object({
  body: object({
    agent: string({
      required_error: 'Agent ID is required',
    }).trim(),
    partner: string({
      required_error: 'Partner ID is required',
    }).trim(),
    status: nativeEnum(AgentOnlineStatus, {
      required_error: 'Status is required',
    }),
    position: object({
      longitude: number({
        required_error: 'Longitude is Required',
      }),
      latitude: number({
        required_error: 'Latitude is Required',
      }),
    }),
  }),
});

export type SyncAgentLocationInput = TypeOf<typeof syncAgentLocatonSchema>['body'];

export const syncFcmTokenSchema = object({
  body: object({
    agent: string({
      required_error: 'Agent ID is required',
    }).trim(),
    token: string({
      required_error: 'Token is required',
    }).trim(),
  }),
});

export type SyncFcmTokenInput = TypeOf<typeof syncFcmTokenSchema>['body'];

export const acceptTaskSchema = object({
  body: object({
    agent: string({
      required_error: 'Agent ID is required',
    }).trim(),
    task: string({
      required_error: 'Task ID is required',
    }).trim(),
    address: string({
      required_error: 'Address ID is required',
    }).trim(),
    status: nativeEnum(AcceptTaskEnum, {
      required_error: 'Status is required',
    }),
  }),
});

export type AcceptTaskInput = TypeOf<typeof acceptTaskSchema>['body'];

export const updateAgentAddressSchema = object({
  body: object({
    agent: string({
      required_error: 'Agent ID is required',
    }).trim(),
    address: string({
      required_error: 'Address ID is required',
    }).trim(),
    notes: string({
      required_error: 'Status is required',
    })
      .array()
      .optional(),
    images: string({
      required_error: 'Status is required',
    })
      .array()
      .optional(),
    signature: string({
      required_error: 'Signature is required',
    }).optional(),
    buildingType: string({
      required_error: 'Building Type is required',
    }).optional(),
    buildingColor: string({
      required_error: 'Building Colour is required',
    }).optional(),
    gatePresent: boolean({
      required_error: 'Signature is required',
    }).optional(),
    gateColor: string({
      required_error: 'Gate Colour is required',
    }).optional(),
    closestLandmark: string({
      required_error: 'Closest Landmark is required',
    }).optional(),
    audioUrl: string({
      required_error: 'Audio Recording is required',
    }).optional(),
    videoUrl: string({
      required_error: 'Video Recording is required',
    }).optional(),
  }),
});

export type UpdateAgentAddressInput = TypeOf<typeof updateAgentAddressSchema>['body'];

export const updateAgentAddressStatusSchema = object({
  body: object({
    agent: string({
      required_error: 'Agent ID is required',
    }).trim(),
    address: string({
      required_error: 'Address ID is required',
    }).trim(),
    status: nativeEnum(AgentStatusUpdateEnum, {
      required_error: 'Status is required',
    }),
  }),
});

export type UpdateAgentAddressStatusInput = TypeOf<typeof updateAgentAddressStatusSchema>['body'];

export const changeAgentPasswordSchema = object({
  body: object({
    agent: string({
      required_error: 'Agent ID is required',
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

export type ChangeAgentPasswordInput = TypeOf<typeof changeAgentPasswordSchema>['body'];

export const submitAgentAddressSchema = object({
  body: object({
    agent: string({
      required_error: 'Agent ID is required',
    }).trim(),
    address: string({
      required_error: 'Address ID is required',
    }).trim(),
    status: nativeEnum(AgentSubmitStatusUpdateEnum, {
      required_error: 'Status is required',
    }),
    position: object({
      longitude: number({
        required_error: 'Longitude is Required',
      }),
      latitude: number({
        required_error: 'Latitude is Required',
      }),
    }),
  }),
});

export type SubmitAgentAddressInput = TypeOf<typeof submitAgentAddressSchema>['body'];

export const updateDisplayImageSchema = object({
  body: object({
    agent: string({
      required_error: 'Agent ID is required',
    }).trim(),
    imageUrl: string({
      required_error: 'Image URL is required',
    }).trim(),
  }),
});

export type UpdateDisplayPictureInput = TypeOf<typeof updateDisplayImageSchema>['body'];

export const createPartnerAgentSchema = object({
  body: object({
    partner: string({
      required_error: 'Partner is required',
    }).trim(),
    email: string({
      required_error: 'Email is required',
    }).trim(),
    lastName: string({
      required_error: 'Last Name is required',
    }).trim(),
    firstName: string({
      required_error: 'First Name is required',
    }).trim(),
    state: string({
      required_error: 'State is required',
    }).trim(),
    password: string({
      required_error: 'State is required',
    })
      .trim()
      .optional(),
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

export type CreatePartnerAgentInput = TypeOf<typeof createPartnerAgentSchema>['body'];

export const withdrawAgentFundSchema = object({
  body: object({
    agent: string({
      required_error: 'Agent is required',
    }).trim(),
    amount: number({
      required_error: 'Amount is required',
    }),
  }),
});

export type WithdrawAgentFundInput = TypeOf<typeof withdrawAgentFundSchema>['body'];

export const upsertBankSchema = object({
  body: object({
    agent: string({
      required_error: 'Agent is required',
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
