import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import { IBvn } from './types/bvn.type';

const BvnSchema = new Schema<IBvn>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    secondPhoneNumber: { type: String, required: false },
    gender: { type: String, required: true },
    bvn: { type: String, required: true },
    nin: { type: String, required: false },
    maritalStatus: { type: String, required: false },
    lgaOfOrigin: { type: String, required: false },
    stateOfOrigin: { type: String, required: false },
    watchListed: { type: String, required: false },
    nameOnCard: { type: String, required: false },
    imageUrl: { type: String, required: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
BvnSchema.post('save', function (error: any, doc, next) {
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
} as ErrorHandlingMiddlewareFunction<IBvn>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Bvn', BvnSchema);
};
