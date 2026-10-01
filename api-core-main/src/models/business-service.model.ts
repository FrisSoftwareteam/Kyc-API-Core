import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import Service from './service.model';
import Business from './business.model';

export interface IBusinessService {
  price: number;
  service: typeof Service;
  business: typeof Business;
}

const BusinessServiceSchema = new Schema<IBusinessService>(
  {
    service: { type: Schema.Types.ObjectId, required: true, ref: 'Service' },
    business: { type: Schema.Types.ObjectId, required: true, ref: 'Business' },
    price: { type: Number, required: true },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
BusinessServiceSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Business Service With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'BUSINESS_SERVICE_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IBusinessService>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('BusinessService', BusinessServiceSchema);
};
