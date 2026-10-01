import User from '../user.model';
import Business from '../business.model';
import Task from '../task.model';

export enum PaymentProviderEnum {
  PAYSTACK = 'paystack',
  WALLET = 'wallet',
}

export enum PaymentTypeEnum {
  CREDIT = 'credit',
  DEBIT = 'debit',
  REFUND = 'refund',
}

export enum PaymentStatusEnum {
  PENDING = 'pending',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
}

export interface ITransaction {
  provider: PaymentProviderEnum;
  business: typeof Business;
  user: typeof User;
  task?: typeof Task;
  amount: number;
  type: PaymentTypeEnum;
  status: PaymentStatusEnum;
  reference: string;
  paidAt: Date;
}
