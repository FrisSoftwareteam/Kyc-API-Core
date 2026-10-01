export interface IChargeData {
  status: boolean;
  message: string;
  chargeIdentity: boolean;
}
export interface IBvnResponse {
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  imageUrl: string;
  phoneNumber: string;
  gender: string;
  bvn: string;
}

export interface IYouverifyAxiosBvnResponse {
  success: boolean;
  statusCode: number;
  message: string;
  name: string;
  data: {
    firstName: string;
    lastName: string;
    middleName: string;
    dateOfBirth: string;
    image: string;
    mobile: string;
    gender: string;
    idNumber: string;
  };
}

export interface INinResponse {
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  imageUrl: string;
  signatureUrl: string;
  phoneNumber: string;
  gender: string;
  nin: string;
  birthState: string;
  nextOfKinState: string;
  religion: string;
  birthLGA: string;
  birthCountry: string;
  country: string;
}

export interface IYouverifyAxiosNinResponse {
  success: boolean;
  statusCode: number;
  message: string;
  name: string;
  data: {
    firstName: string;
    lastName: string;
    middleName: string;
    dateOfBirth: string;
    image: string;
    signature: string;
    mobile: string;
    gender: string;
    idNumber: string;
    birthState: string;
    nokState: string;
    religion: string;
    birthLGA: string;
    birthCountry: string;
    country: string;
  };
}

export interface IIdentityProvider {
  fetchBvn(bvn: string, country: string, premiumBvn?: boolean): Promise<IBvnResponse>;
}

export interface ICreateIndividualRiskCheck {
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  advancedOptions: {
    idExpiryDate: string;
    isIdVerified: boolean;
    phoneNumber: string;
    lengthOfStay: string;
    occupation: string;
    industry: string;
  };
}

export interface ICreateBusinessRiskCheck {
  businessName: string;
  businessIndustry: string;
  country: string;
  city: string;
  advancedOptions: {
    idExpiryDate: string;
    isIdVerified: boolean;
    phoneNumber: string;
    lengthOfStay: string;
    occupation: string;
    industry: string;
  };
}

export interface ICreateIndividualRiskCheckYouverifyResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    latestReport?: string;
    parentId?: string;
    type: 'individual';
    latestRiskScore: number;
    latestAdverseMediaScore: number;
    latestRiskStatus: string;
    trackingInterval: number;
    trackingStatus: string;
    riskReportHistory: [];
    _id: string;
    entityInformation: {
      personalInformation: {
        firstName: string;
        lastName: string;
        idNumber: string;
        idExpiryDate?: string;
        isIdVerified: boolean;
        phoneNumber: string;
      };
      geographicInformation: {
        country: string;
        city: string;
        lengthOfStay: string;
      };
      workInformation: {
        occupation: string;
        industry: string;
      };
      _id: string;
    };
    businessId: string;
    requestedAt: string;
    requestedById: string;
    reportNextUpdateAt: string;
    reportlastUpdatedAt: string;
    createdAt: string;
    lastModifiedAt: string;
    _createdAt: string;
    enterpriseCode: string;
    allValidationPassed: string;
    id: string;
    metadata: {
      [key: string]: string;
    };
    requestedBy: {
      firstName: string;
      lastName: string;
      middleName: string;
      id: string;
    };
  };
  links: [];
}

export interface ICreateBusinessRiskCheckYouverifyResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    latestReport?: string;
    parentId?: string;
    type: 'individual';
    latestRiskScore: number;
    latestAdverseMediaScore: number;
    latestRiskStatus: string;
    trackingInterval: number;
    trackingStatus: string;
    riskReportHistory: [];
    _id: string;
    entityInformation: {
      businessInformation: {
        businessName: string;
        businessIndustry: string;
        idNumber: string;
        idExpiryDate?: null | string;
        isIdVerified: boolean;
        phoneNumber: string;
      };
      geographicInformation: {
        country: string;
        city: string;
        lengthOfStay: number;
      };
      _id: string;
    };
    businessId: string;
    requestedAt: string;
    requestedById: string;
    reportNextUpdateAt: string;
    reportlastUpdatedAt: string;
    createdAt: string;
    lastModifiedAt: string;
    _createdAt: string;
    enterpriseCode: string;
    allValidationPassed: string;
    id: string;
    metadata: {
      [key: string]: string;
    };
    requestedBy: {
      firstName: string;
      lastName: string;
      middleName: string;
      id: string;
    };
  };
  links: [];
}

export interface ICreateIndividualRiskCheckResponse {
  id: string;
  status: boolean;
  message: string;
  charge: boolean;
}

export interface ICreateBusinessRiskCheckResponse {
  id: string;
  status: boolean;
  message: string;
  charge: boolean;
}

export interface IDriverLicenseResponse {
  reason?: string;
  dataValidation: boolean;
  selfieValidation: boolean;
  firstName: string;
  middleName?: null | string;
  lastName: string;
  expiredDate: string;
  issuedDate: string;
  stateOfIssuance: string;
  imageUrl: string;
  phoneNumber: string | null;
  email: string | null;
  dateOfBirth: string;
  idNumber: string;
  gender: string;
}

export interface IYouverifyAxiosDriverLicenseResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    id: string;
    parentId: string;
    status: string;
    reason: string | null;
    dataValidation: boolean;
    selfieValidation: boolean;
    firstName: string;
    middleName?: string;
    lastName: string;
    expiredDate: string;
    issuedDate: string;
    stateOfIssuance: string;
    notifyWhenIdExpire: boolean;
    image: string;
    mobile: string | null;
    email: string | null;
    dateOfBirth: string;
    isConsent: boolean;
    idNumber: string;
    businessId: string;
    type: string;
    gender: string;
    requestedAt: string;
    requestedById: string;
    country: string;
    createdAt: string;
    lastModifiedAt: string;
    requestedBy: {
      firstName: string;
      lastName: string;
      middleName?: string;
      id: string;
    };
  };
  links: [];
}

export interface IPassportResponse {
  parentId: null | string;
  reason: string | null;
  dataValidation: boolean;
  selfieValidation: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  expiredDate: string;
  imageUrl: string;
  signature: string | null;
  issuedAt: string;
  issuedDate: string;
  phoneNumber: string | null;
  dateOfBirth: string;
  idNumber: string;
  gender: string;
}

export interface IYouverifyAxiosPassportResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    id: string;
    parentId: null | string;
    status: string;
    reason: string | null;
    dataValidation: boolean;
    selfieValidation: boolean;
    firstName: string;
    middleName: string;
    lastName: string;
    expiredDate: string;
    notifyWhenIdExpire: boolean;
    image: string;
    signature: string | null;
    issuedAt: string;
    issuedDate: string;
    mobile: string | null;
    dateOfBirth: string;
    isConsent: boolean;
    idNumber: string;
    businessId: string;
    type: string;
    gender: string;
    requestedAt: string;
    requestedById: string;
    country: string;
    createdAt: string;
    lastModifiedAt: string;
    requestedBy: {
      firstName: string;
      lastName: string;
      middleName?: string;
      id: string;
    };
  };
  links: [];
}

export interface IAmlResponse {
  sanctions: Record<string, unknown>[];
  pep: Record<string, unknown>[];
  crime: Record<string, unknown>[];
  debarment: Record<string, unknown>[];
  financialServices: Record<string, unknown>[];
  government: Record<string, unknown>[];
  role: Record<string, unknown>[];
  religion: Record<string, unknown>[];
  military: Record<string, unknown>[];
  frozenAsset: Record<string, unknown>[];
  personOfInterest: Record<string, unknown>[];
  totalEntity: number;
  categoryCount: object;
  queriedWith: string;
  query: string;
}

export interface IYouverifyAxiosAmlResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    status: string;
    parentId: string | null;
    isSubjectConsent: true;
    type: string;
    sanctions: [
      {
        title: string[];
        entityType: string;
        datasets: string[];
        birthDate: string[];
        firstName: string[];
        nationality: string[];
        notes: string[];
        topics: string[];
        weakAlias: string[];
        addressEntity: string[];
        alias: string[];
        country: string[];
        name: string[];
        position: string[];
        middleName: string[];
        secondName: string[];
        lastName: string[];
        deathDate: string[];
        religion: string[];
        fatherName: string[];
        birthPlace: string[];
        gender: string[];
        sourceUrl: string[];
        ethnicity: string[];
        sanctions: [
          {
            sourceUrl: string[];
            unscId: string[];
            startDate: string[];
            program: string[];
            listingDate: string[];
            authority: string[];
            country: string[];
          },
          {
            startDate: string[];
            summary: string[];
            sourceUrl: string[];
            country: string[];
            authority: string[];
            program: string[];
          },
          {
            startDate: string[];
            authority: string[];
            sourceUrl: string[];
            listingDate: string[];
            program: string[];
            reason: string[];
            country: string[];
          },
          {
            sourceUrl: string[];
            program: string[];
            authority: string[];
            listingDate: string[];
            startDate: string[];
            country: string[];
          },
          {
            reason: string[];
            program: string[];
            country: string[];
            listingDate: string[];
            sourceUrl: string[];
            authority: string[];
            startDate: string[];
          },
          {
            authority: string[];
            country: string[];
            reason: string[];
            sourceUrl: string[];
          },
          {
            program: string[];
            reason: string[];
            sourceUrl: string[];
            authority: string[];
            country: string[];
          },
          {
            program: string[];
            country: string[];
            listingDate: string[];
            authority: string[];
            status: string[];
            startDate: string[];
            sourceUrl: string[];
            unscId: string[];
          },
          {
            unscId: string[];
            program: string[];
            country: string[];
            startDate: string[];
            authority: string[];
            sourceUrl: string[];
          },
          {
            authority: string[];
            sourceUrl: string[];
            provisions: string[];
            program: string[];
            reason: string[];
            country: string[];
          },
          {
            sourceUrl: string[];
            country: string[];
            listingDate: string[];
            authority: string[];
            program: string[];
            startDate: string[];
          },
          {
            unscId: string[];
            startDate: string[];
            sourceUrl: string[];
            authority: string[];
            program: string[];
            listingDate: string[];
          },
          {
            authority: string[];
            sourceUrl: string[];
            listingDate: string[];
            unscId: string[];
            country: string[];
          },
        ];
        unknownLinkTo: [
          {
            object: [
              {
                sourceUrl: string[];
                weakAlias: string[];
                alias: string[];
                notes: string[];
                country: string[];
                name: string[];
                topics: string[];
              },
            ];
            role: string[];
          },
          {
            object: [
              {
                country: string[];
                previousName: string[];
                alias: string[];
                notes: string[];
                topics: string[];
                name: string[];
                sourceUrl: string[];
                weakAlias: string[];
              },
            ];
            role: string[];
          },
          {
            role: string[];
            object: [
              {
                notes: string[];
                name: string[];
                topics: string[];
                alias: string[];
                weakAlias: string[];
                country: string[];
                sourceUrl: string[];
              },
            ];
          },
        ];
        unknownLinkFrom: [
          {
            subject: [
              {
                notes: string[];
                name: string[];
                topics: string[];
                alias: string[];
                weakAlias: string[];
                country: string[];
                sourceUrl: string[];
              },
            ];
            role: string[];
          },
          {
            role: string[];
            subject: [
              {
                notes: string[];
                alias: string[];
                weakAlias: string[];
                topics: string[];
                name: string[];
              },
            ];
          },
          {
            subject: [
              {
                name: string[];
                alias: string[];
                topics: string[];
                country: string[];
                notes: string[];
                sourceUrl: string[];
                weakAlias: string[];
                incorporationDate: string[];
              },
            ];
            role: string[];
          },
        ];
      },
    ];
    pep: [];
    crime: [];
    debarment: [];
    financial_services: [];
    government: [];
    role: [];
    religion: [];
    military: [];
    frozen_asset: [];
    personOfInterest: [];
    totalEntity: number;
    categoryCount: {
      [key: string]: number;
    };
    queriedWith: string;
    query: string;
    businessId: string;
    requestedAt: string;
    requestedById: string;
    createdAt: string;
    lastModifiedAt: string;
    _createdAt: string;
    _lastModifiedAt: string;
    id: string;
    requestedBy: {
      firstName: string;
      lastName: string;
      middleName: string;
      id: string;
    };
  };
  links: [];
}
