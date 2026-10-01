// import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
// import { ConflictError } from '../errors/api.error';
// import {
//   DocumentCategory,
//   DocumentTitle,
//   DocumentStatus,
//   ICertificateDocument,
// } from './types/document.type';

// const CertificateDocumentSchema = new Schema<ICertificateDocument>(
//   {
//     business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
//     candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
//     task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
//     verifiedAt: { type: Date },
//     cost: { type: Number, required: true },
//     imageUrl: { type: String, required: true },
//     title: { type: String, enum: DocumentTitle, required: true },
//     category: { type: String, enum: DocumentCategory, required: true },
//     status: { type: String, enum: DocumentStatus, default: DocumentStatus.PENDING },
//   },
//   { timestamps: true },
// );

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// CertificateDocumentSchema.post('save', function (error: any, doc, next) {
//   if (error.name === 'MongoServerError' && error.code === 11000) {
//     const objectKeys: string[] = [];

//     for (const item in error.keyPattern) {
//       objectKeys.push(item);
//     }
//     next(
//       new ConflictError(
//         `Certificate Document With ${objectKeys.join(' ').split(',')} already exists`,
//         {
//           code: 'CERTIFICATE_ALREADY_EXISTS',
//         },
//       ),
//     );
//   } else {
//     next();
//   }
// } as ErrorHandlingMiddlewareFunction<ICertificateDocument>);

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// export default ({ mongooseConnection }: Record<string, any>) => {
//   return mongooseConnection.model('CertificateDocument', CertificateDocumentSchema);
// };
