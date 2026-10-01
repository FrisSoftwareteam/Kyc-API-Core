import CandidateFormatter, { ICandidateFormatter } from './candidate.formatter';
import AddressFormatter, { IAddressFormatter } from './address.formatter';
import IdentityFormatter, { IIdentityFormatter } from './identity.formatter';
import BankStatementFormatter, { IBankStatementFormatter } from './bank-statement.formatter';
import CertificateDocumentFormatter, {
  ICertificateDocumentFormatter,
} from './certificate-document.formatter';
import ProjectVerificationFormatter, { IProjectVerificationFormatter } from './project.formatter';
import AcademicCertificateFormatter, { IAcademicCertificateFormatter } from './academic.formatter';
import DocumentFormatter, { IDocumentFormatter } from './document.formatter';
import BusinessPartnershipFormatter, {
  IBusinessPartnershipFormatter,
} from './business-partnership.formatter';
import GuarantorVerificationFormatter, {
  IGuarantorVerificationFormatter,
} from './guarantor-verification.formatter';
import EmploymentVerificationFormatter, {
  IEmploymentVerificationFormatter,
} from './employment-verification.formatter';

import TenancyVerificationFormatter, {
  ITenancyVerificationFormatter,
} from './tenancy-verification.formatter';

import HouseholdVerificationFormatter, {
  IHouseholdVerificationFormatter,
} from './household-verification.formatter';

import CriminalVerificationFormatter, {
  ICriminalVerificationFormatter,
} from './criminal-verification.formatter';

import BusinessVerificationFormatter, {
  IBusinessVerificationFormatter,
} from './business-verification.formatter';

export interface ITaskFormatter {
  address?: IAddressFormatter;
  identity?: IIdentityFormatter;
  candidate: ICandidateFormatter;
  bankStatement?: IBankStatementFormatter;
  certificateDocument?: ICertificateDocumentFormatter;
  projectVerification?: IProjectVerificationFormatter;
  academicCertificate?: IAcademicCertificateFormatter;
  businessPartnership?: IBusinessPartnershipFormatter;
  guarantorVerification?: IGuarantorVerificationFormatter;
  employmentVerification?: IEmploymentVerificationFormatter;
  tenancyVerification?: ITenancyVerificationFormatter;
  householdVerification?: IHouseholdVerificationFormatter;
  criminalVerification?: ICriminalVerificationFormatter;
  businessVerification?: IBusinessVerificationFormatter;
  document?: IDocumentFormatter;
  cost: number;
  tat: number;
  status: string;
  createdAt: string;
  taskStatus: string;
  paymentType: string;
  failedReason: string;
  candidateAlias: string;
  verificationType: string;
  _id: string;
  identityData: Record<string, unknown>;
  paid: boolean;
  approvedAt: Date;
  approvedByAdmin: boolean;
  needAdminApproval: boolean;
  paymentRequired: boolean;
  completedAt: Date;
  entity: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ task }: any): ITaskFormatter => {
  return {
    _id: task?._id,
    candidate: CandidateFormatter({ candidate: task?.candidate }),
    address: task?.address ? AddressFormatter({ address: task?.address }) : undefined,
    identity: task?.identity ? IdentityFormatter({ identity: task?.identity }) : undefined,
    bankStatement: task?.bankStatement
      ? BankStatementFormatter({ bankStatement: task?.bankStatement })
      : undefined,
    certificateDocument: task?.certificateDocument
      ? task?.certificateDocument?.map((certificateDocument: Record<string, unknown>) =>
          CertificateDocumentFormatter({ certificateDocument }),
        )
      : undefined,
    projectVerification: task?.project
      ? ProjectVerificationFormatter({ project: task?.project })
      : undefined,
    academicCertificate: task?.academicCertificate
      ? AcademicCertificateFormatter({ academic: task?.academicCertificate })
      : undefined,
    document: task?.document ? DocumentFormatter({ document: task?.document }) : undefined,
    businessPartnership: task?.businessPartnership
      ? BusinessPartnershipFormatter({ partnership: task?.businessPartnership })
      : undefined,
    guarantorVerification: task?.guarantorVerification
      ? GuarantorVerificationFormatter({ guarantor: task?.guarantorVerification })
      : undefined,
    employmentVerification: task?.employmentVerification
      ? EmploymentVerificationFormatter({ employment: task?.employmentVerification })
      : undefined,
    criminalVerification: task?.criminalVerification
      ? CriminalVerificationFormatter({ criminal: task?.criminalVerification })
      : undefined,
    businessVerification: task?.businessVerification
      ? BusinessVerificationFormatter({ business: task?.businessVerification })
      : undefined,
    tenancyVerification: task?.tenancyVerification
      ? TenancyVerificationFormatter({ tenancy: task?.tenancyVerification })
      : undefined,
    householdVerification: task?.householdVerification
      ? HouseholdVerificationFormatter({ household: task?.householdVerification })
      : undefined,
    verificationType: task?.verifications ? task?.verifications.join(',') : undefined,
    paymentType: task?.paymentType ? task?.paymentType : undefined,
    cost: task?.cost ? task?.cost : undefined,
    status: task?.status,
    candidateAlias: task?.candidateAlias,
    taskStatus: task?.taskStatus,
    failedReason: task?.failedReason,
    createdAt: task?.createdAt,
    identityData: task?.identityData,
    paid: task?.paid,
    tat: task?.tat,
    approvedAt: task?.approvedAt,
    approvedByAdmin: task?.approvedByAdmin,
    needAdminApproval: task?.needAdminApproval,
    paymentRequired: task?.paymentRequired,
    completedAt: task?.completedAt,
    entity: task?.entity,
  };
};
