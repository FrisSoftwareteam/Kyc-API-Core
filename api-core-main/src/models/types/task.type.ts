import Business from '../business.model';
import Candidate from '../candidate.model';
import User from '../user.model';

export enum ChargeTypeEnum {
  CARD = 'card',
  WALLET = 'wallet',
}

export enum StatusEnum {
  PENDING = 'pending',
  CREATED = 'created',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REJECTED = 'rejected',
  APPROVED = 'approved',
  INPROGRESS = 'inprogress',
}

export enum EntityEnum {
  BUSINESS = 'business',
  CUSTOMER = 'customer',
}

export interface ITask {
  tat: number;
  cost: number;
  paid: boolean;
  approvedAt: Date;
  completedAt: Date;
  user: typeof User;
  status: StatusEnum;
  entity: EntityEnum;
  failedReason: string;
  verifications: string[];
  candidateAlias?: string;
  paymentRequired: boolean;
  approvedByAdmin: boolean;
  business: typeof Business;
  needAdminApproval: boolean;
  paymentType: ChargeTypeEnum;
  candidate: typeof Candidate;
  metadata: {
    [key: string]: unknown;
  };
  identityData: {
    firstName: string;
    lastName: string;
    type: string;
    idNumber: string;
    verified: boolean;
  };
}
