import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import { INin } from './types/nin.type';

const NinSchema = new Schema<INin>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    secondPhoneNumber: { type: String, required: false },
    gender: { type: String, required: true },
    nin: { type: String, required: true },
    maritalStatus: { type: String, required: false },
    lgaOfOrigin: { type: String, required: false },
    stateOfOrigin: { type: String, required: false },
    imageUrl: { type: String, required: false },
    signatureUrl: { type: String, required: false },
    email: { type: String, required: false },
    birthState: { type: String, required: false },
    nextOfKinState: { type: String, required: false },
    religion: { type: String, required: false },
    birthLGA: { type: String, required: false },
    birthCountry: { type: String, required: false },
    country: { type: String, required: false, default: 'NG' },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
NinSchema.post('save', function (error: any, doc, next) {
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
} as ErrorHandlingMiddlewareFunction<INin>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Nin', NinSchema);
};
