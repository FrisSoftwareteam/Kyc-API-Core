import { ConflictError } from '../errors/api.error';
import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import {
  IAddress,
  AddressStatusEnum,
  CategoryEnum,
  AdminApprovalStatusEnum,
} from './types/address.type';

const AddressSchema = new Schema<IAddress>(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    agent: { type: Schema.Types.ObjectId, required: false, ref: 'Agent', default: null },
    partner: { type: Schema.Types.ObjectId, required: false, ref: 'Partner' },
    formatAddress: { type: String, required: true },
    position: {
      latitude: { type: String, required: true },
      longitude: { type: String, required: true },
    },
    submissionLocation: {
      latitude: { type: Number, required: false },
      longitude: { type: Number, required: false },
    },
    submittedAt: { type: Date, required: false },
    submissionExpectedAt: { type: Date, required: true },
    timelines: {
      acceptedAt: { type: Date, required: false },
      assignedAt: { type: Date, required: false },
      completedAt: { type: Date, required: false },
    },
    details: {
      flatNumber: { type: String, required: false },
      buildingName: { type: String, required: false },
      buildingNumber: { type: String, required: false },
      subStreet: { type: String, required: false },
      street: { type: String, required: true },
      landmark: { type: String, required: true },
      state: { type: String, required: true },
      city: { type: String, required: false },
      country: { type: String, required: true },
      lga: { type: String, required: true },
      buildingType: { type: String, required: false },
      buildingColor: { type: String, required: false },
      gatePresent: { type: String, required: false },
      gateColor: { type: String, required: false },
    },
    agentReports: {
      buildingType: { type: String, required: false },
      buildingColor: { type: String, required: false },
      gatePresent: { type: Boolean, default: false },
      gateColor: { type: String, required: false },
      availabilityConfirmedBy: { type: String, required: false },
      closestLandmark: { type: String, required: false },
      audioUrl: { type: String, required: false },
      videoUrl: { type: String, required: false },
    },
    status: { type: String, enum: AddressStatusEnum, default: AddressStatusEnum.CREATED },
    isFlagged: { type: Boolean, required: false },
    flaggedDetails: {
      unflaggedBy: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
      unflaggedAt: { type: Date, required: false },
      flaggedAt: { type: Date, required: false },
    },
    signature: { type: String, required: false },
    category: { type: String, enum: CategoryEnum, default: CategoryEnum.INDIVIDUAL },
    images: { type: [String] },
    notes: { type: [String] },
    cost: { type: Number, required: false },
    approver: {
      user: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
      status: {
        type: String,
        required: true,
        enum: AdminApprovalStatusEnum,
        default: AdminApprovalStatusEnum.REVIEW,
      },
    },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
AddressSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Address With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'ADDRESS_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IAddress>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: any) => {
  return mongooseConnection.model('Address', AddressSchema);
};
