import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import Provider from './provider.model';
import Category from './category.model';

export interface IService {
  name: string;
  slug: string;
  provider: typeof Provider;
  category: typeof Category;
  price: number;
  active: boolean;
}

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    provider: { type: Schema.Types.ObjectId, required: false, ref: 'Provider' },
    category: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },
    price: { type: Number, required: true },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
ServiceSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Service With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'SERVICE_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IService>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Service', ServiceSchema);
};
