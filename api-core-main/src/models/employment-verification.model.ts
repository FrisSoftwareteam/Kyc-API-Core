import { Schema } from 'mongoose';
import { DocumentStatus, IEmployment, EmploymentVerificationType } from './types/document.type';

const EmploymentVerificationSchema = new Schema<IEmployment>(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    verifier: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    verifiedAt: { type: Date, default: null },
    cost: { type: Number, required: true },
    address: { type: String, required: true },
    type: { type: String, enum: EmploymentVerificationType, required: true },
    identity: {
      type: { type: String, required: true },
      number: { type: String, required: true },
    },
    companyName: { type: String, required: true },
    role: { type: String, required: true },
    status: { type: String, enum: DocumentStatus, default: DocumentStatus.PENDING },
    responsePayload: { type: Map, of: String, required: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('EmploymentVerification', EmploymentVerificationSchema);
};
