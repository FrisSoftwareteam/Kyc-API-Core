import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import {
  ITransaction,
  PaymentTypeEnum,
  PaymentStatusEnum,
  PaymentProviderEnum,
} from './types/transaction.type';

const TransactionSchema = new Schema<ITransaction>(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    business: { type: Schema.Types.ObjectId, required: true, ref: 'Business' },
    task: { type: Schema.Types.ObjectId, required: false, ref: 'Task' },
    amount: { type: Number, required: true },
    type: { type: String, enum: PaymentTypeEnum, required: true },
    reference: { type: String, required: true },
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
TransactionSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Transaction With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'TRANSACTION_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<ITransaction>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Transaction', TransactionSchema);
};
