import { Document } from 'mongoose';

import Business from '../business.model';
import Candidate from '../candidate.model';
import Task from '../task.model';

export enum OtherTaskStatusEnum {
  PENDING = 'pending',
  INPROGRESS = 'inprogress',
  FAILED = 'failed',
  VERIFIED = 'verified',
}

export enum IOtherTaskTypeEnum {
  EDUCATION = 'education',
}

export interface IOtherTask extends Document {
  candidate: typeof Candidate;
  business: typeof Business;
  task: typeof Task;
  requestPayload: Map<string, unknown>;
  responsePayload: Map<string, unknown>;
  type: IOtherTaskTypeEnum;
  subType: string;
  status: OtherTaskStatusEnum;
}
