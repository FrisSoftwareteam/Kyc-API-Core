import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import { StatusEnum, ICategory } from './types/category.type';

// export interface ICategory {
//   name: string;
//   slug: string;
//   status: StatusEnum;
// }

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    status: { type: String, enum: StatusEnum, default: StatusEnum.ACTIVE },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
CategorySchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(
        `Category Document With ${objectKeys.join(' ').split(',')} already exists`,
        {
          code: 'CATEGORY_ALREADY_EXISTS',
        },
      ),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<ICategory>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Category', CategorySchema);
};
