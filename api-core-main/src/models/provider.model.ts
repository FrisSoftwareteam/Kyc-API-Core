import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';

export enum IServiceType {
  ADDRESS = 'address',
  IDENTITY = 'identity',
}

export enum IIdentityServiceType {
  ADDRESS = 'address',
  BVN = 'bvn',
  NIN = 'nin',
  DL = 'driver-license',
  PASSPORT = 'international-passport',
  vNIN = 'vnin',
  IDENTITY = 'identity',
  AML = 'aml',
}

export interface IProvider {
  name: string;
  slug: string;
  service: IServiceType;
  prices: Map<string, number>;
  active: boolean;
  selected: boolean;
}

const ProviderSchema = new Schema<IProvider>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    service: { type: String, enum: IServiceType },
    prices: { type: Map },
    active: { type: Boolean, required: true, default: true },
    selected: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
ProviderSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Provider With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'PROVIDER_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IProvider>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Provider', ProviderSchema);
};
