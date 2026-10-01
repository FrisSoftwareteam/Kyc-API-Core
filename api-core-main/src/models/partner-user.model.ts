import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import User, { UserStatus } from './user.model';
import Role from './role.model';

export interface IPartnerUser {
  user: typeof User;
  status: UserStatus;
  role: typeof Role;
}

const PartnerUserSchema = new Schema<IPartnerUser>(
  {
    user: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    status: { type: String, enum: UserStatus, default: UserStatus.INACTIVE },
    role: { type: String, required: true, ref: 'Role' },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
PartnerUserSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Partner User With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'PARTNER_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IPartnerUser>);

export default PartnerUserSchema;
