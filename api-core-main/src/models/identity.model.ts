import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import { IIdentity, IdentityStatusEnum } from './types/identity.type';
import { IIdentityServiceType } from './provider.model';

const IdentitySchema = new Schema<IIdentity>(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    idNumber: { type: String, required: true },
    idType: { type: String, enum: IIdentityServiceType, required: true },
    verifiedAt: { type: Date },
    status: { type: String, enum: IdentityStatusEnum, default: IdentityStatusEnum.PENDING },
    validationData: { type: Map, of: String, required: false },
    identityResponse: { type: Map, of: String, required: false },
    cost: { type: Number, required: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
IdentitySchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Identity With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'IDENTITY_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IIdentity>);

IdentitySchema.methods.autoPopulateLead = function (next: () => void) {
  this.populate('bvns'); // Ensure 'this' is properly scoped
  next();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Identity', IdentitySchema);
};
