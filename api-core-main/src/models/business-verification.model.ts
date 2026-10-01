import { Schema } from 'mongoose';
import { IBusinessVerification, BusinessVerificationStatusEnum } from './types/document.type';

const BusinessVerificationSchema = new Schema<IBusinessVerification>(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    verifier: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    verifiedAt: { type: Date, default: null },
    cost: { type: Number, required: true },
    businessName: { type: String, required: true },
    address: { type: Schema.Types.ObjectId, required: false, ref: 'Address' },
    status: { type: String, enum: BusinessVerificationStatusEnum, required: false },
    responsePayload: { type: Map, of: String, required: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('BusinessVerification', BusinessVerificationSchema);
};
