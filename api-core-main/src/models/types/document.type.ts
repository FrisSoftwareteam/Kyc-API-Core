import Business from '../business.model';
import Candidate from '../candidate.model';
import Task from '../task.model';
import User from '../user.model';
import IdentityVerification from '../identity.model';
import AddressVerification from '../address.model';
import GuarantorVerification from '../guarantor-verification.model';
import BusinessVerification from '../business-partnership.model';
import EmploymentVerificaton from '../employment-verification.model';

export enum DocumentStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  FAILED = 'failed',
}

export enum DocumentCategory {
  LAND = 'land',
  CERTIFICATION = 'certification',
  PROPERTY_OWNERSHIP = 'property-ownership',
}

export enum AcademicCategory {
  TRANSCRIPT = 'transcript',
  CERTIFICATION = 'certification',
}

export enum DocumentTitle {
  DEEDS_OF_ASSIGNMENT = 'deeds-of-assignment',
  CERTIFICATE_OF_OCCUPANCY = 'certificate-of-occupancy',
  SURVEY_PLAN = 'survey-plan',
  EXCISION = 'excision',
  RECEIPT = 'receipt',
  GOVERNORS_CONSENT = 'governors-consent',
  WAEC = 'waec-certificate',
  NECO = 'neco-certificate',
  GCE = 'gce-certificate',
  SCHOOL_TRANSCRIPT = 'school-transcript',
  TERTIARY_INSTITUTION_CERTIFICATE = 'tertiary-institution-certificate',
  INSTITUTIONAL_CERTIFICATION_VERIFICATION = 'ican-icsan-cibn',
  NYSC = 'nysc-certificate',
  FOREIGN_CERTIFICATIONS = 'foreign-certifications',
  LAND_PURCHASE_RECEIPT = 'land-purchase-receipt',
  CONTRACT_OF_SALES = 'contract-of-sales',
  DEED_OF_ASSIGNMENT = 'deed-of-assignment',
  DEED_OF_MORTGAGE = 'deed-of-mortgage',
  DEED_OF_GIFT = 'deed-of-gift',
  GRANT_OF_PROBATE = 'grant-of-probate',
  LETTER_OF_ADMINISTRATION = 'letter-of-administration',
}
export enum AcademicBoard {
  WAEC = 'waec-certificate',
  NECO = 'neco-certificate',
  GCE = 'gce-certificate',
}

export interface IDocument {
  category: DocumentCategory;
  documentUrls: string[];
  nameOfDocument: string;
  verifiedAt: Date;
  status: DocumentStatus;
  cost: number;
  candidate: typeof Candidate;
  business: typeof Business;
  task: typeof Task;
  verifier: typeof User;
  responsePayload: Map<string, string>;
}

export interface IAcademicDocument {
  examNumber: string;
  resultUrl: string;
  examinationBoard: DocumentTitle;
  verifiedAt: Date;
  status: DocumentStatus;
  cost: number;
  category: AcademicCategory;
  candidate: typeof Candidate;
  business: typeof Business;
  task: typeof Task;
  verifier: typeof User;
  responsePayload: Map<string, string>;
  letterOfAuthorization: string;
  letterOfRequest: string;
}

export interface IGuarantor {
  cost: number;
  candidate: typeof Candidate;
  business: typeof Business;
  task: typeof Task;
  verifier: typeof User;
  responsePayload: Map<string, string>;
  type: 'physical' | 'digital';
  name: string;
  addressType: string;
  address: string;
  nin: string;
  certificateUrl: string;
  phoneNumber: string;
  email: string;
  questionaireUrl: string;
  attestationUrl: string;
  verifiedAt: Date;
  status: DocumentStatus;
}

export enum EmploymentVerificationType {
  POLICE_CLEARANCE = 'police-clearance',
  DOCUMENT = 'document',
  CRIMINAL_RECORD = 'criminal',
  RECORD = 'record',
  PERSONALITY_CHECK = 'personality-check',
}

export interface IEmployment {
  cost: number;
  candidate: typeof Candidate;
  business: typeof Business;
  task: typeof Task;
  verifier: typeof User;
  responsePayload: Map<string, string>;
  addressType: string;
  address: string;
  identity: {
    type: string;
    number: string;
  };
  companyName: string;
  type: EmploymentVerificationType;
  role: string;
  verifiedAt: Date;
  status: DocumentStatus;
}

export enum MarriageStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  FAILED = 'failed',
}

export enum MarriageTypeEnum {
  RELIGION = 'religion',
  COURT = 'court',
  TRADITIONAL = 'traditional',
}

export enum MarriageCategoryEnum {
  POST_MARRIAGE = 'post-marriage',
  PRE_MARRIAGE = 'pre-marriage',
}

export interface IMarriage {
  cost: number;
  candidate: typeof Candidate;
  business: typeof Business;
  task: typeof Task;
  verifier: typeof User;
  responsePayload: Map<string, string>;
  certificateUrl: string;
  letterUrl: string;
  type: MarriageTypeEnum;
  category: MarriageCategoryEnum;
  images: string[];
  identity: {
    type: string;
    number: string;
  };
  verifiedAt: Date;
  status: MarriageStatus;
}

export enum CriminalStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  FAILED = 'failed',
}

export interface ICriminal {
  cost: number;
  candidate: typeof Candidate;
  business: typeof Business;
  task: typeof Task;
  verifier: typeof User;
  responsePayload: Map<string, string>;
  letterUrl: string;
  identity: {
    type: string;
    number: string;
  };
  verifiedAt: Date;
  status: CriminalStatus;
}

export enum TenancyStatusEnum {
  VERIFIED = 'verified',
  PENDING = 'pending',
  FAILED = 'failed',
}

export enum TenancyCategoryEnum {
  LANDLORD = 'landlord',
  TENANT = 'tenant',
}

export enum TenancyTypeEnum {
  IDENTITY = 'identity',
  ADDRESS = 'address',
  OWNERSHIP = 'ownership',
  AGENCY = 'agency',
  GUARANTOR = 'guarantor',
  BUSINESS = 'business',
  EMPLOYMENT = 'employment',
  BUSINESS_PARTNERSHIP = 'businessPartnership',
}

export interface ITenancy {
  cost: number;
  candidate: typeof Candidate;
  business: typeof Business;
  task: typeof Task;
  verifier: typeof User;
  responsePayload: Map<string, string>;
  identityVerification: typeof IdentityVerification;
  addressVerification: typeof AddressVerification;
  employmentVerification: typeof EmploymentVerificaton;
  businessVerification: typeof BusinessVerification;
  guarantorVerification: typeof GuarantorVerification;
  ownership: Map<string, unknown>;
  agency: Map<string, unknown>;
  verifiedAt: Date;
  status: TenancyStatusEnum;
  category: TenancyCategoryEnum;
  type: TenancyTypeEnum;
}

export enum HouseholdStatusEnum {
  VERIFIED = 'verified',
  PENDING = 'pending',
  FAILED = 'failed',
}

export enum HouseholdTypeEnum {
  IDENTITY = 'identity',
  ADDRESS = 'address',
  OWNERSHIP = 'ownership',
  ANCESTRY = 'ancestry',
  GUARANTOR = 'guarantor',
  EMPLOYMENT = 'employment',
}

export interface IHousehold {
  cost: number;
  candidate: typeof Candidate;
  business: typeof Business;
  task: typeof Task;
  verifier: typeof User;
  responsePayload: Map<string, string>;
  identityVerification: typeof IdentityVerification;
  addressVerification: typeof AddressVerification;
  employmentVerification: typeof EmploymentVerificaton;
  guarantorVerification: typeof GuarantorVerification;
  ancestry: Map<string, unknown>;
  verifiedAt: Date;
  status: TenancyStatusEnum;
  type: TenancyTypeEnum;
}

export enum BusinessVerificationStatusEnum {
  VERIFIED = 'verified',
  PENDING = 'pending',
  FAILED = 'failed',
}

export interface IBusinessVerification {
  cost: number;
  candidate: typeof Candidate;
  business: typeof Business;
  task: typeof Task;
  verifier: typeof User;
  responsePayload: Map<string, string>;
  businessName: string;
  address: typeof AddressVerification;
  status: BusinessVerificationStatusEnum;
  verifiedAt: Date;
}
