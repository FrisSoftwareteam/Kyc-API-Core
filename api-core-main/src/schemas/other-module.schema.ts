import { TypeOf, object, string, array, number, nativeEnum } from 'zod';
import {
  MarriageTypeEnum,
  TenancyCategoryEnum,
  TenancyTypeEnum,
} from '../models/types/document.type';
import { addressSchema } from './address.schema';
import { identityVerificationSchema } from './identity.schema';

export const documentVerificationSchema = object({
  category: string({
    required_error: 'Category is required',
  }).trim(),
  nameOfDocument: string({
    required_error: 'Title is required',
  }).trim(),
  documentUrls: array(
    string({
      required_error: 'Document URL is required',
    }),
  ),
}).optional();

export type DocumentUploadVerificationInput = TypeOf<typeof documentVerificationSchema>;

export const academicVerificationSchema = object({
  category: string({
    required_error: 'Category is required',
  }).trim(),
  examinationBoard: string({
    required_error: 'Examination Board is required',
  }).optional(),
  examNumber: string({
    required_error: 'Exam Number is required',
  }).optional(),
  resultUrl: string({
    required_error: 'Certificate Image URL is required',
  }).optional(),
  letterOfRequest: string({
    required_error: 'Letter of Request URL is required',
  }).optional(),
  letterOfAuthorization: string({
    required_error: 'Letter of Authorization URL is required',
  }).optional(),
}).optional();

export type AcademicUploadVerificationInput = TypeOf<typeof academicVerificationSchema>;

export const otherVerificationSchema = array(
  object({
    type: string({
      required_error: 'Type is required',
    }).trim(),
    subType: string({
      required_error: 'Sub Type is required',
    }).trim(),
    payload: object({}),
  }),
).optional();

export type OtherVerificationInput = TypeOf<typeof otherVerificationSchema>;

export const projectVerificationSchema = object({
  projectImageUrl: string({
    required_error: 'Project Image is required',
  }),
  letterOfAuthorizationImageUrl: string({
    required_error: 'Letter of Authorization Image is required',
  }),
  description: string({
    required_error: 'Description is required',
  }),
  documents: string().array(),
  handlingType: string({
    required_error: 'Type is required',
  }),
  interval: number({
    required_error: 'Interval is required',
  }),
}).optional();

export type ProjectVerificationInput = TypeOf<typeof projectVerificationSchema>;

export const businessPartnershipSchema = object({
  businessName: string({
    required_error: 'Business Name is required',
  }),
  directorsNin: array(
    string({
      required_error: 'Directors NIN is required',
    }),
  ),
  address: string({
    required_error: 'Address is required',
  }),
  certificateUrl: string({
    required_error: 'CAC Certificate is required',
  }),
  type: string({
    required_error: 'Type is required',
  }),
  guarantor: object({
    name: string({
      required_error: 'Business Guarantor Name is required',
    }).trim(),
    address: string({
      required_error: 'Business Guarantor Address is required',
    }).trim(),
    certificateUrl: string({
      required_error: 'Business Guarantor CAC Certificate is required',
    }).trim(),
    id: string({
      required_error: 'Business Guarantor ID Card is required',
    }).trim(),
    nin: string({
      required_error: 'Business Guarantor NIN is required',
    })
      .trim()
      .optional(),
  }),
}).optional();
export type BusinessPartnershipInput = TypeOf<typeof businessPartnershipSchema>;

export const guarantorVerificationSchema = object({
  name: string({
    required_error: 'Guarantor Name is required',
  }),
  address: string({
    required_error: 'Address is required',
  }),
  certificateUrl: string({
    required_error: 'CAC Certificate is required',
  }),
  type: string({
    required_error: 'Type is required',
  }),
  addressType: string({
    required_error: 'Address Type is required',
  }),
  nin: string({
    required_error: 'NIN is required',
  }),
  attestationUrl: string({
    required_error: 'Attestation Url is required',
  }),
  questionaireUrl: string({
    required_error: 'Questionaire Url is required',
  }),
  email: string({
    required_error: 'Email Url is required',
  }),
  phoneNumber: string({
    required_error: 'Phone Number is required',
  }),
}).optional();
export type GuarantorVerificationInput = TypeOf<typeof guarantorVerificationSchema>;

export const employmentVerificationSchema = object({
  type: string({
    required_error: 'Type is required',
  }),
  address: string({
    required_error: 'Address is required',
  }),
  identity: object({
    type: string({
      required_error: 'Type is required',
    }),
    number: string({
      required_error: 'Number is required',
    }),
  }),
  companyName: string({
    required_error: 'Company Name is required',
  }),
  role: string({
    required_error: 'Address Type is required',
  }),
}).optional();

export type EmploymentVerificationInput = TypeOf<typeof employmentVerificationSchema>;

export const amlVerificationSchema = object({
  type: string({
    required_error: 'Type is required',
  }),
  name: string({
    required_error: 'Name is required',
  }),
}).optional();

export type AmlVerificationInput = TypeOf<typeof amlVerificationSchema>;

export const marriageVerificationSchema = object({
  certificateUrl: string({
    required_error: 'Certificate URL is required',
  }),
  letterUrl: string({
    required_error: 'Letter URL is required',
  }),
  type: nativeEnum(MarriageTypeEnum, {
    required_error: 'Marriage Type is required',
  }),
  images: array(string({})).optional(),
}).optional();

export type MarriageVerificationInput = TypeOf<typeof marriageVerificationSchema>;

export const criminalVerificationSchema = object({
  letterUrl: string({
    required_error: 'Letter URL is required',
  }),
}).optional();

export type CriminalVerificationInput = TypeOf<typeof criminalVerificationSchema>;

export const tenancyVerificationSchema = object({
  category: nativeEnum(TenancyCategoryEnum, {
    required_error: 'Tenancy Category is required',
  }),
  type: nativeEnum(TenancyTypeEnum, {
    required_error: 'Tenancy Type is required',
  }),
  identityVerification: identityVerificationSchema.optional(),
  addressVerification: addressSchema.optional(),
  guarantorVerification: guarantorVerificationSchema.optional(),
  businessPartnership: businessPartnershipSchema.optional(),
  employmentVerification: employmentVerificationSchema.optional(),
  agency: object({}).optional(),
  ownership: object({}).optional(),
}).optional();

export type TenancyVerificationInput = TypeOf<typeof tenancyVerificationSchema>;

export const householdVerificationSchema = object({
  type: string({
    required_error: 'Household Type is required',
  }),
  identityVerification: identityVerificationSchema.optional(),
  addressVerification: addressSchema.optional(),
  guarantorVerification: guarantorVerificationSchema.optional(),
  employmentVerification: employmentVerificationSchema.optional(),
  ancestry: object({}).optional(),
}).optional();

export type HouseholdVerificationInput = TypeOf<typeof householdVerificationSchema>;

export const businessVerificationSchema = object({
  businessName: string({
    required_error: 'Business Name is required',
  }),
  address: addressSchema.optional(),
}).optional();

export type BusinessVerificationSchema = TypeOf<typeof businessVerificationSchema>;
