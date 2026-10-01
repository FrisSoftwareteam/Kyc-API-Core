import { Schema } from 'mongoose';
import { DocumentStatus, IGuarantor } from './types/document.type';

const GuarantorVerificationSchema = new Schema<IGuarantor>(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    verifier: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    verifiedAt: { type: Date, default: null },
    cost: { type: Number, required: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    addressType: { type: String, required: true },
    address: { type: String, required: true },
    nin: { type: String, required: true },
    certificateUrl: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    questionaireUrl: { type: String, required: true },
    attestationUrl: { type: String, required: true },
    status: { type: String, enum: DocumentStatus, default: DocumentStatus.PENDING },
    responsePayload: { type: Map, of: String, required: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('GuarantorVerification', GuarantorVerificationSchema);
};
