import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import User, { UserStatus } from './user.model';
import Role from './role.model';

export interface IBusinessUser {
  user: typeof User;
  status: UserStatus;
  role: typeof Role;
}

const BusinessUserSchema = new Schema<IBusinessUser>(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    status: { type: String, enum: UserStatus, default: UserStatus.INACTIVE },
    role: { type: Schema.Types.ObjectId, required: true, ref: 'Role' },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
BusinessUserSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Business User With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'BUSINESS_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IBusinessUser>);

export default BusinessUserSchema;
