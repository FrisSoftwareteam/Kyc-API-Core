import Business from '../business.model';
import Candidate from '../candidate.model';
import Agent from '../agent.model';
import Task from '../task.model';
import Partner from '../partner.model';
import User from '../user.model';
import { CompletedStatus } from '../../constants';

export enum AddressStatusEnum {
  CREATED = 'created',
  ACCEPTED = 'accepted',
  PENDING = 'pending',
  INPROGRESS = 'inprogress',
  FAILED = CompletedStatus.FAILED,
  VERIFIED = CompletedStatus.VERIFIED,
  FLAGGED = 'flagged',
  REJECTED = 'rejected',
}

export enum AgentStatusUpdateEnum {
  ACCEPTED = 'accepted',
  INPROGRESS = 'inprogress',
  FAILED = CompletedStatus.FAILED,
  VERIFIED = CompletedStatus.VERIFIED,
}

export enum AdminApprovalStatusEnum {
  REVIEW = 'review',
  APPROVED = 'approved',
  DECLINED = 'declined',
}

export enum AgentSubmitStatusUpdateEnum {
  FAILED = CompletedStatus.FAILED,
  VERIFIED = CompletedStatus.VERIFIED,
}

export enum CategoryEnum {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
  GUARANTOR = 'guarantor',
}

export interface IAddress {
  candidate: typeof Candidate;
  business: typeof Business;
  task: typeof Task;
  agent: typeof Agent;
  partner: typeof Partner;
  formatAddress: string;
  position: {
    latitude: number;
    longitude: number;
  };
  submissionLocation: {
    latitude: number;
    longitude: number;
  };
  submittedAt: Date;
  submissionExpectedAt: Date;
  timelines: {
    acceptedAt: Date;
    assignedAt: Date;
    completedAt: Date;
  };
  status: AddressStatusEnum;
  category: CategoryEnum;
  images: string[];
  notes: string[];
  details: {
    flatNumber?: string;
    buildingName?: string;
    buildingNumber?: string;
    subStreet?: string;
    street: string;
    landmark: string;
    state: string;
    city: string;
    country: string;
    lga: string;
    buildingType?: string;
    buildingColor?: string;
    gatePresent?: string;
    gateColor?: string;
  };
  agentReports: {
    buildingType: string;
    buildingColor: string;
    gatePresent: boolean;
    gateColor: string;
    availabilityConfirmedBy: string;
    closestLandmark: string;
  };
  signature: string;
  isFlagged: boolean;
  cost: number;
  flaggedDetails: {
    unflaggedBy: typeof User;
    unflaggedAt: Date;
    flaggedAt: Date;
  };
  approver: {
    user: typeof User;
    status: AdminApprovalStatusEnum;
  };
}
