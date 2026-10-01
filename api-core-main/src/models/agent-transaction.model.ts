import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import {
  IAgentTransaction,
  PaymentStatusEnum,
  PaymentProviderEnum,
  PaymentTypeEnum,
} from './types/agent-transaction.type';

const AgentTransactionSchema = new Schema<IAgentTransaction>(
  {
    agent: { type: Schema.Types.ObjectId, required: true, ref: 'Agent' },
    task: { type: Schema.Types.ObjectId, required: false, ref: 'Task' },
    amount: { type: Number, required: true },
    transferCode: { type: String, required: true },
    reference: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankName: { type: String, required: true },
    sessionId: { type: String, required: false },
    type: { type: String, enum: PaymentTypeEnum, required: true },
    paidAt: { type: Date, required: false },
    provider: {
      type: String,
      enum: PaymentProviderEnum,
      default: PaymentProviderEnum.PAYSTACK,
      required: true,
    },
    status: {
      type: String,
      enum: PaymentStatusEnum,
      default: PaymentStatusEnum.PENDING,
      required: true,
    },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
AgentTransactionSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(
        `Agent Transaction With ${objectKeys.join(' ').split(',')} already exists`,
        {
          code: 'AGENT_TRANSACTION_ALREADY_EXISTS',
        },
      ),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IAgentTransaction>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('AgentTransaction', AgentTransactionSchema);
};
