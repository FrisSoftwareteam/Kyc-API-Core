import { Document } from 'mongoose';
import Business from '../business.model';
import Candidate from '../candidate.model';
import Task from '../task.model';

export interface IAML extends Document {
  sanctions: unknown;
  pep: unknown;
  crime: unknown;
  debarment: unknown;
  financialServices: unknown;
  government: unknown;
  role: unknown;
  religion: unknown;
  military: unknown;
  frozenAsset: unknown;
  personOfInterest: unknown;
  totalEntity: number;
  categoryCount: object;
  queriedWith: string;
  query: string;
  type: IAmlEnum;
  cost: number;
  business: typeof Business;
  candidate: typeof Candidate;
  task: typeof Task;
}

export enum IAmlEnum {
  ALL = 'all',
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
}
