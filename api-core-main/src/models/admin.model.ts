import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import { IAdmin, AdminStatusEnum } from './types/admin.type';

const AdminSchema = new Schema<IAdmin>(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    role: { type: Schema.Types.ObjectId, required: true, ref: 'Role' },
    permissions: { type: [String], required: true },
    status: { type: String, enum: AdminStatusEnum, default: AdminStatusEnum.ACTIVE },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
AdminSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Admin ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'ADMIN_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IAdmin>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Admin', AdminSchema);
};
