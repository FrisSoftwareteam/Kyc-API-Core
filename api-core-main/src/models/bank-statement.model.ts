import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import { IBankStatement } from './types/bank-statement.type';

const BankStatementSchema = new Schema<IBankStatement>(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    providerId: { type: String, required: true },
    requestData: { type: Map, of: String, required: true },
    responseData: { type: Map, of: String, required: true },
    providerName: { type: String, required: true },
    cost: { type: Number, required: true },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
BankStatementSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Bank Statement With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'BANK_STATEMENT_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IBankStatement>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('BankStatement', BankStatementSchema);
};
