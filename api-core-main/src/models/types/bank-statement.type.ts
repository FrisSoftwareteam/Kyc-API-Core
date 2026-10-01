import Business from '../business.model';
import Candidate from '../candidate.model';
import Task from '../task.model';

export interface IBankStatement {
  business: typeof Business;
  candidate: typeof Candidate;
  task: typeof Task;
  providerId: string;
  requestData: Map<string, unknown>;
  responseData: Map<string, unknown>;
  providerName: string;
  cost: number;
}
