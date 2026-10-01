import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import { IPassport } from './types/passport.type';

const PassportSchema = new Schema<IPassport>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    phoneNumber: { type: String, required: false },
    gender: { type: String, required: true },
    passportNumber: { type: String, required: true },
    maritalStatus: { type: String, required: false },
    imageUrl: { type: String, required: false },
    expiredDate: { type: String, required: true },
    issuedAt: { type: String, required: true },
    issuedDate: { type: String, required: true },
    stateOfIssuance: { type: String, required: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
PassportSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Identity With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'IDENTITY_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IPassport>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('InternationalPassport', PassportSchema);
};
