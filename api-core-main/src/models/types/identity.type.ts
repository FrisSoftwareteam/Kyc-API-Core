import { Document } from 'mongoose';

import Business from '../business.model';
import Candidate from '../candidate.model';
import Agent from '../agent.model';
import Task from '../task.model';
import { IIdentityServiceType } from '../provider.model';
import { CompletedStatus } from '../../constants';

export enum IdentityStatusEnum {
  PENDING = 'pending',
  INPROGRESS = 'inprogress',
  FLAGGED = 'flagged',
  SUSPENDED = 'suspended',
  FAILED = CompletedStatus.VERIFIED,
  VERIFIED = CompletedStatus.VERIFIED,
}

export interface IIdentity extends Document {
  candidate: typeof Candidate;
  business: typeof Business;
  task: typeof Task;
  agent: typeof Agent;
  idNumber: string;
  idType: IIdentityServiceType;
  verifiedAt: Date;
  status: IdentityStatusEnum;
  validationData?: Map<string, unknown>;
  identityResponse: Map<string, unknown>;
  cost: number;
}
