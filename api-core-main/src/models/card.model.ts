import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import { ICard } from './types/card.type';

const CardSchema = new Schema<ICard>(
  {
    business: { type: Schema.Types.ObjectId, required: true, ref: 'Business' },
    authorizationCode: { type: String, required: true },
    bin: { type: String, required: true },
    lastFourDigit: { type: String, required: true },
    expiryMonth: { type: String, required: true },
    expiryYear: { type: String, required: true },
    cardType: { type: String, required: true },
    reusable: { type: Boolean, required: true },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
CardSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Cards With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'CARD_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<ICard>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Card', CardSchema);
};
