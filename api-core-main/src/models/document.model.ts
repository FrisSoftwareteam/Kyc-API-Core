import { Schema } from 'mongoose';
import { DocumentCategory, DocumentStatus, IDocument } from './types/document.type';

const DocumentSchema = new Schema<IDocument>(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    verifiedAt: { type: Date },
    cost: { type: Number, required: true },
    nameOfDocument: { type: String, required: true },
    documentUrls: { type: [String], required: true },
    category: { type: String, enum: DocumentCategory, required: true },
    status: { type: String, enum: DocumentStatus, default: DocumentStatus.PENDING },
    responsePayload: { type: Map, of: String, required: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Document', DocumentSchema);
};
