import Agent from '../agent.model';
import Task from '../task.model';

export enum PaymentProviderEnum {
  PAYSTACK = 'paystack',
  WALLET = 'wallet',
}

export enum PaymentStatusEnum {
  PENDING = 'pending',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  REVERSED = 'reversed',
  RETRACTED = 'retracted',
}

export enum PaymentTypeEnum {
  PAYMENT = 'payment',
  WITHDRAWAL = 'withdrawal',
}

export interface IAgentTransaction {
  provider: PaymentProviderEnum;
  agent: typeof Agent;
  task: typeof Task;
  amount: number;
  status: PaymentStatusEnum;
  type: PaymentTypeEnum;
  transferCode: string;
  reference: string;
  sessionId: string;
  accountNumber: string;
  bankName: string;
  paidAt: Date;
}
