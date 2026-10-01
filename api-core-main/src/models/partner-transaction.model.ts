import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import {
  IPartnerTransaction,
  PaymentStatusEnum,
  PaymentProviderEnum,
  PaymentTypeEnum,
} from './types/partner-transaction.type';

const PartnerTransactionSchema = new Schema<IPartnerTransaction>(
  {
    partner: { type: Schema.Types.ObjectId, required: true, ref: 'Partner' },
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
      required: true,
      enum: PaymentProviderEnum,
      default: PaymentProviderEnum.PAYSTACK,
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
PartnerTransactionSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(
        `Partner Transaction With ${objectKeys.join(' ').split(',')} already exists`,
        {
          code: 'PARTNER_TRANSACTION_ALREADY_EXISTS',
        },
      ),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IPartnerTransaction>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('PartnerTransaction', PartnerTransactionSchema);
};
