import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';

export interface ICandidate {
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phoneNumber: string;
  imageUrl?: string;
  dateOfBirth?: string;
  ids: {
    bvn: string;
    nin: string;
    'driver-license': string;
    'international-passport': string;
  };
}

const CandidateSchema = new Schema<ICandidate>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String, required: false },
    dateOfBirth: { type: String, required: false },
    email: { type: String, required: false },
    phoneNumber: { type: String, required: true },
    imageUrl: { type: String, required: false },
    ids: {
      bvn: { type: String, required: false },
      nin: { type: String, required: false },
      'driver-license': { type: String, required: false },
      'international-passport': { type: String, required: false },
    },
  },
  { timestamps: true },
);

CandidateSchema.index({ firstName: 'text', lastName: 'text' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
CandidateSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Candidate With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'CANDIDATE_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<ICandidate>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Candidate', CandidateSchema);
};
