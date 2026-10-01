import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import {
  AcademicBoard,
  DocumentStatus,
  IAcademicDocument,
  AcademicCategory,
  // DocumentCategory,
} from './types/document.type';

const AcademicDocumentSchema = new Schema<IAcademicDocument>(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    verifier: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    verifiedAt: { type: Date },
    cost: { type: Number, required: true },
    category: { type: String, enum: AcademicCategory, required: true },
    examinationBoard: { type: String, enum: AcademicBoard, required: false },
    examNumber: { type: String, required: false },
    letterOfAuthorization: { type: String, required: false },
    letterOfRequest: { type: String, required: false },
    resultUrl: { type: String, required: false },
    status: { type: String, enum: DocumentStatus, default: DocumentStatus.PENDING },
    responsePayload: { type: Map, of: String, require: false },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
AcademicDocumentSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(
        `Academic Document with ${objectKeys.join(' ').split(',')} already exists`,
        {
          code: 'ACADEMIC_DOCUMENT_EXISTS',
        },
      ),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IAcademicDocument>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('AcademicDocument', AcademicDocumentSchema);
};
