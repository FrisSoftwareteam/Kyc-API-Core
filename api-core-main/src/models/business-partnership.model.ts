import { Schema } from 'mongoose';
import { DocumentStatus } from './types/document.type';

const BusinessPartnershipSchema = new Schema(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    verifier: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    cost: { type: Number, required: true },
    verifiedAt: { type: Date },
    businessName: { type: String, required: true },
    directorNins: { type: [String], required: true },
    address: { type: String, required: true },
    certificateUrl: { type: String, required: true },
    type: { type: String, enum: ['police-clearance', 'adverse-media'], required: true },
    guarantor: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      certificateUrl: { type: String, required: true },
      idCard: { type: String, required: false },
      nin: { type: String, required: false },
    },
    status: { type: String, enum: DocumentStatus, default: DocumentStatus.PENDING },
    responsePayload: { type: Map, of: String, required: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('BusinessPartnership', BusinessPartnershipSchema);
};
