import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import { ITask, StatusEnum, ChargeTypeEnum, EntityEnum } from './types/task.type';

const TaskSchema = new Schema<ITask>(
  {
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    business: { type: Schema.Types.ObjectId, required: true, ref: 'Business' },
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    status: { type: String, required: true, enum: StatusEnum, default: StatusEnum.CREATED },
    candidateAlias: { type: String, required: false, default: null },
    paymentType: {
      type: String,
      required: true,
      enum: ChargeTypeEnum,
      default: ChargeTypeEnum.WALLET,
    },
    entity: {
      type: String,
      required: true,
      enum: EntityEnum,
      default: EntityEnum.BUSINESS,
    },
    verifications: { type: [String], required: true },
    cost: { type: Number, required: true },
    completedAt: { type: Date, required: false },
    failedReason: { type: String, required: false },
    paymentRequired: { type: Boolean, default: false },
    needAdminApproval: { type: Boolean, default: false },
    approvedByAdmin: { type: Boolean, default: null },
    approvedAt: { type: Date, default: null },
    paid: { type: Boolean, default: false },
    tat: { type: Number, default: 24 },
    identityData: {
      firstName: { type: String, default: null },
      lastName: { type: String, default: null },
      type: { type: String, default: null },
      idNumber: { type: String, default: null },
      verified: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

TaskSchema.virtual('address', {
  ref: 'Address',
  localField: '_id',
  foreignField: 'task',
  justOne: true,
});

TaskSchema.virtual('identity', {
  ref: 'Identity',
  localField: '_id',
  foreignField: 'task',
  justOne: true,
});

TaskSchema.virtual('bankStatement', {
  ref: 'BankStatement',
  localField: '_id',
  foreignField: 'task',
  justOne: true,
});

TaskSchema.virtual('document', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'task',
  justOne: true,
});

TaskSchema.virtual('project', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'task',
  justOne: true,
});

TaskSchema.virtual('academicCertificate', {
  ref: 'AcademicDocument',
  localField: '_id',
  foreignField: 'task',
  justOne: true,
});

TaskSchema.virtual('businessPartnership', {
  ref: 'BusinessPartnership',
  localField: '_id',
  foreignField: 'task',
  justOne: true,
});

TaskSchema.virtual('guarantorVerification', {
  ref: 'GuarantorVerification',
  localField: '_id',
  foreignField: 'task',
  justOne: true,
});

TaskSchema.virtual('employmentVerification', {
  ref: 'EmploymentVerification',
  localField: '_id',
  foreignField: 'task',
  justOne: true,
});

TaskSchema.virtual('tenancyVerification', {
  ref: 'TenancyVerification',
  localField: '_id',
  foreignField: 'task',
  justOne: true,
});

TaskSchema.virtual('criminalVerification', {
  ref: 'CriminalRecord',
  localField: '_id',
  foreignField: 'task',
  justOne: true,
});

TaskSchema.virtual('householdVerification', {
  ref: 'HouseholdVerification',
  localField: '_id',
  foreignField: 'task',
  justOne: true,
});

TaskSchema.virtual('businessVerification', {
  ref: 'BusinessVerification',
  localField: '_id',
  foreignField: 'task',
  justOne: true,
});

TaskSchema.virtual('otherTask', {
  ref: 'OtherTask',
  localField: '_id',
  foreignField: 'task',
  // justOne: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
TaskSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Task With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'TASK_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<ITask>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Task', TaskSchema);
};
