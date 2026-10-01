import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import { IAML, IAmlEnum } from './types/aml.type';

const AmlSchema = new Schema<IAML>(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    type: { type: String, enum: IAmlEnum },
    // provider: { type: Schema.Types.ObjectId, required: false, ref: 'Provider' },
    sanctions: { type: Array, default: [] },
    pep: { type: Array, default: [] },
    crime: { type: Array, default: [] },
    debarment: { type: Array, default: [] },
    financialServices: { type: Array, default: [] },
    government: { type: Array, default: [] },
    role: { type: Array, default: [] },
    religion: { type: Array, default: [] },
    military: { type: Array, default: [] },
    frozenAsset: { type: Array, default: [] },
    personOfInterest: { type: Array, default: [] },
    totalEntity: { type: Number, required: true },
    categoryCount: { type: Object, required: true },
    queriedWith: { type: String, required: true },
    query: { type: String, required: true },
    cost: { type: Number, required: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
AmlSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Service With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'AML_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IAML>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Aml', AmlSchema);
};
