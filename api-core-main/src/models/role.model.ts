import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';

export enum EntityType {
  BUSINESS = 'business',
  PARTNER = 'partner',
  ADMINISTRATOR = 'admin',
}

export interface IRole {
  name: string;
  permissions: string[];
  entity: EntityType;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true },
    permissions: { type: [String], required: true },
    entity: { type: String, enum: EntityType, required: true },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
RoleSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Role ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'ROLE_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IRole>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Role', RoleSchema);
};
