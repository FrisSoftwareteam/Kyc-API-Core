import { Schema } from 'mongoose';
import { CriminalStatus, ICriminal } from './types/document.type';

const CriminalRecordSchema = new Schema<ICriminal>(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    verifier: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    verifiedAt: { type: Date, default: null },
    cost: { type: Number, required: true },
    letterUrl: { type: String, required: true },
    status: { type: String, enum: CriminalStatus, default: CriminalStatus.PENDING },
    responsePayload: { type: Map, of: String, required: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('CriminalRecord', CriminalRecordSchema);
};
