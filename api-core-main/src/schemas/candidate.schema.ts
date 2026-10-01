import { object, string, TypeOf, boolean } from 'zod';

export const createCandidateByFormSchema = object({
  body: object({
    firstName: string({
      required_error: 'First Name is required',
    }).trim(),
    lastName: string({
      required_error: 'Last Name is required',
    }),
    middleName: string({
      required_error: 'Middle Name is required',
    }).optional(),
    phoneNumber: string({
      required_error: 'Phone Number is required',
    }),
    email: string({
      required_error: 'Email is required',
    }).optional(),
    dateOfBirth: string({
      required_error: 'Date of Birth is required',
    }),
    imageUrl: string({
      required_error: 'Image URL is required',
    })
      .url({
        message: 'Invalid Image URL',
      })
      .startsWith('https://', { message: 'Must provide secure URL' })
      .optional(),
    businessId: string({
      required_error: 'Business ID is required',
    }).trim(),
  }),
});

export type CreateCandidateByFormInput = TypeOf<typeof createCandidateByFormSchema>['body'];

export const createCandidateByIdentitySchema = object({
  body: object({
    idType: string({
      required_error: 'Identity Type is required',
    }).trim(),
    idNumber: string({
      required_error: 'Identity Number is required',
    }).trim(),
    businessId: string({
      required_error: 'Business ID is required',
    }).trim(),
    consent: boolean({
      required_error: 'Consent is required',
    }),
  }),
});

export type CreateCandidateByIdentityInput = TypeOf<typeof createCandidateByIdentitySchema>['body'];
