import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import User, { UserStatus } from './user.model';
import BusinessUserSchema from './business-user.model';

export interface IBusiness {
  name: string;
  email: string;
  user: typeof User;
  users: {
    user: typeof User;
    status: UserStatus;
  }[];
  cacNumber: string;
  address: string;
  phoneNumber: string;
  industry: string;
  directorNin?: string;
  countryCode: string;
  wallet: {
    bookBalance: number;
    balance: number;
    outstandingBalance: number;
  };
  api?: {
    webhook?: string;
    key?: string;
  };
  tat?: {
    address?: string;
    document?: string;
    certificate?: string;
  };
  active: boolean;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    email: { type: String },
    user: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    users: {
      type: [BusinessUserSchema],
      required: true,
      default: [],
    },
    name: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    industry: { type: String, required: false },
    cacNumber: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    directorNin: { type: String, unique: true, required: true },
    countryCode: { type: String, required: true },
    wallet: {
      bookBalance: { type: Number, default: 0 },
      balance: { type: Number, default: 0 },
      outstandingBalance: { type: Number, default: 0 },
    },
    api: {
      key: { type: String, required: false },
      webhook: { type: String, required: false },
    },
    tat: {
      address: { type: String, required: false, default: '24' },
      lagosAddress: { type: String, required: false, default: '24' },
      document: { type: String, required: false, default: '24' },
      certificate: { type: String, required: false, default: '24' },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
BusinessSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Business With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'BUSINESS_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IBusiness>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Business', BusinessSchema);
};
