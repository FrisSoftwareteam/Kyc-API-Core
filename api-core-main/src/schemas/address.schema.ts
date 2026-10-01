import { object, string, TypeOf, boolean, nativeEnum, ZodIssueCode } from 'zod';
import { ChargeTypeEnum } from '../models/types/task.type';

export const addressSchema = object({
  street: string({
    required_error: 'State is required',
  }).trim(),
  subStreet: string({
    required_error: 'Sub Street is required',
  })
    .trim()
    .optional(),
  buildingNumber: string({
    required_error: 'State is required',
  }).trim(),
  buildingName: string({
    required_error: 'Building Name is required',
  })
    .trim()
    .optional(),
  lga: string({
    required_error: 'LGA is required',
  }).trim(),
  landmark: string({
    required_error: 'Landmark is required',
  })
    .trim()
    .optional(),
  state: string({
    required_error: 'State is required',
  }).trim(),
  country: string({
    required_error: 'Country is required',
  }).trim(),
}).optional();

export type AddressInput = TypeOf<typeof addressSchema>;

export const createIndividualAddressSchema = object({
  body: object({
    chargeType: nativeEnum(ChargeTypeEnum, {
      required_error: 'Charge Type is required',
    }).default(ChargeTypeEnum.WALLET),
    card: string({
      required_error: 'Card ID is required When Charge Type is Card',
    })
      .trim()
      .optional(),
    candidateId: string({
      required_error: 'Candidate ID is required',
    }).trim(),
    businessId: string({
      required_error: 'Business ID is required',
    }).trim(),
    userId: string({
      required_error: 'User ID is required',
    }).trim(),
    address: addressSchema,
    candidateConsentRequired: boolean({
      required_error: 'Candidate Consent is required',
    }),
    description: string({
      required_error: 'Description is required',
    })
      .trim()
      .optional(),
    metadata: object({}).optional(),
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

export type CreateIndividualAddressInput = TypeOf<typeof createIndividualAddressSchema>['body'];
