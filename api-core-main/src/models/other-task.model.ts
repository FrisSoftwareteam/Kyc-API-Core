import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import { IOtherTask, OtherTaskStatusEnum, IOtherTaskTypeEnum } from './types/other-task.type';

const OtherTaskSchema = new Schema<IOtherTask>(
  {
    business: { type: Schema.Types.ObjectId, required: false, ref: 'Business' },
    candidate: { type: Schema.Types.ObjectId, required: false, ref: 'Candidate' },
    task: { type: Schema.Types.ObjectId, required: true, ref: 'Task' },
    requestPayload: { type: Map, of: [{ type: String }, { type: Number }], required: true },
    responsePayload: { type: Map, of: [{ type: String }, { type: Number }], required: true },
    type: { type: String, enum: IOtherTaskTypeEnum, required: true },
    subType: { type: String },
    status: { type: String, enum: OtherTaskStatusEnum, default: OtherTaskStatusEnum.PENDING },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
OtherTaskSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Other Task With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'OTHER_TASK_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IOtherTask>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('OtherTask', OtherTaskSchema);
};
