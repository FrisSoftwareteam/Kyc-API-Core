import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ConflictError } from '../errors/api.error';
import { AgentStatus, IAgent, AgentOnlineStatus } from './types/agent.type';
import { AGENT_DEFAULT_IMAGE_URL } from '../constants';

const AgentSchema = new Schema<IAgent>(
  {
    partner: { type: Schema.Types.ObjectId, required: false, ref: 'Partner' },
    user: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    status: { type: String, enum: AgentStatus, default: AgentStatus.INACTIVE },
    onlineStatus: { type: String, enum: AgentOnlineStatus, default: AgentOnlineStatus.OFFLINE },
    fcmTokens: { type: [String], required: false },
    eventId: { type: String, required: false },
    state: { type: String, required: false },
    imageUrl: { type: String, required: false, default: AGENT_DEFAULT_IMAGE_URL },
    wallet: {
      outstandingPayment: { type: Number, required: false, default: 0 },
      withdrawableAmount: { type: Number, required: false, default: 0 },
      totalPaid: { type: Number, required: false, default: 0 },
    },
    bank: {
      bankName: { type: String, required: false },
      accountNumber: { type: String, required: false },
      accountName: { type: String, required: false },
      recipientCode: { type: String, required: false },
    },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
AgentSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`User With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'AGENT_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IAgent>);

AgentSchema.pre('save', async function (next) {
  this.set('eventId', String(this._id));
  next();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: any) => {
  return mongooseConnection.model('Agent', AgentSchema);
};
