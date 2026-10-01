import { Schema } from 'mongoose';
import {
  MarriageStatus,
  MarriageTypeEnum,
  MarriageCategoryEnum,
  IMarriage,
} from './types/document.type';

const MarriageVerificationSchema = new Schema<IMarriage>(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    verifier: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    verifiedAt: { type: Date, default: null },
    cost: { type: Number, required: true },
    certificateUrl: { type: String, required: true },
    letterUrl: { type: String, required: true },
    type: { type: String, enum: MarriageTypeEnum, required: true },
    category: { type: String, enum: MarriageCategoryEnum, required: true },
    images: { type: [String], required: false },
    status: { type: String, enum: MarriageStatus, default: MarriageStatus.PENDING },
    responsePayload: { type: Map, of: String, required: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('MarriageCertificate', MarriageVerificationSchema);
};
