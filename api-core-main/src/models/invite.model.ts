import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import { UserType } from '../constants';

export interface IInvite {
  type: UserType;
  modelId: string;
  email: string;
  requestPayload: Map<string, unknown>;
  inviteToken: string;
  inviteTokenExpiry: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    type: { type: String, enum: UserType, required: true },
    modelId: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    requestPayload: { type: Map },
    inviteToken: { type: String, required: true, unique: true },
    inviteTokenExpiry: { type: Date, required: true },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
InviteSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Invite With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'INVITE_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IInvite>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Invite', InviteSchema);
};
