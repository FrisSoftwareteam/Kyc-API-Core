import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import Candidate from './candidate.model';
import Business from './business.model';

export interface IBusinessCandidate {
  candidate: typeof Candidate;
  business: typeof Business;
  price: number;
}

const BusinessCandidateSchema = new Schema<IBusinessCandidate>(
  {
    candidate: { type: Schema.Types.ObjectId, required: true, ref: 'Candidate' },
    business: { type: Schema.Types.ObjectId, required: true, ref: 'Business' },
    price: { type: Number, required: true },
  },
  { timestamps: true },
);

BusinessCandidateSchema.index({ candidate: 1, business: 1 }, { unique: true });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
BusinessCandidateSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Candidate With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'BUSINESS_CANDIDATE_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IBusinessCandidate>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('BusinessCandidate', BusinessCandidateSchema);
};
