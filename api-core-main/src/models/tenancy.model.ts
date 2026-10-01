import { Schema } from 'mongoose';
import {
  TenancyStatusEnum,
  ITenancy,
  TenancyCategoryEnum,
  TenancyTypeEnum,
} from './types/document.type';

const TenancyVerificationSchema = new Schema<ITenancy>(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    verifier: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    verifiedAt: { type: Date, default: null },
    cost: { type: Number, required: true },
    identityVerification: { type: Schema.Types.ObjectId, required: false, ref: 'Identity' },
    addressVerification: { type: Schema.Types.ObjectId, required: false, ref: 'Address' },
    employmentVerification: { type: Schema.Types.ObjectId, required: false, ref: 'Employment' },
    businessVerification: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'BusinessPartnership',
    },
    guarantorVerification: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'GuarantorVerification',
    },
    ownership: { type: Object, required: false },
    agency: { type: Object, required: false },
    status: { type: String, enum: TenancyStatusEnum, default: TenancyStatusEnum.PENDING },
    category: { type: String, enum: TenancyCategoryEnum, required: true },
    type: { type: String, enum: TenancyTypeEnum, require: true },
    responsePayload: { type: Map, of: String, required: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('TenancyVerification', TenancyVerificationSchema);
};
