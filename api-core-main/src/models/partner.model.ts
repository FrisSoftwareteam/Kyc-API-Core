import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import { ADDRESS_PRICES } from '../constants';
import { ConflictError } from '../errors/api.error';
import User, { UserStatus } from './user.model';
import PartnerUserSchema from './partner-user.model';

export interface IPartner {
  name: string;
  email: string;
  user: typeof User;
  users: {
    user: typeof User;
    status: UserStatus;
  }[];
  address: string;
  countryCode: string;
  active: boolean;
  phoneNumber: string;
  cacNumber: string;
  directorNin: string;
  states: string[];
  wallet: {
    outstandingPayment?: number;
    withdrawableAmount?: number;
  };
  bank: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    recipientCode: string;
  };
  prices: {
    address: {
      agent: {
        lagos: number;
        others: number;
        [key: string]: number;
      };
      partner: {
        lagos: number;
        others: number;
        [key: string]: number;
      };
    };
  };
  settings: {
    'can-manage-task': boolean;
    'can-reassign-task': boolean;
    'can-manage-agents': boolean;
    'can-view-agents-task': boolean;
    'can-view-agents-location': boolean;
    'can-view-agents-activities': boolean;
    'can-view-agents-payment-activities': boolean;
  };
}

const PartnerSchema = new Schema<IPartner>(
  {
    user: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
    users: {
      type: [PartnerUserSchema],
      required: true,
      default: [],
    },
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    countryCode: { type: String, required: true },
    active: { type: Boolean, default: true },
    phoneNumber: { type: String, required: true, unique: true },
    cacNumber: { type: String, required: true, unique: true },
    directorNin: { type: String, unique: true, required: true },
    states: { type: [String], required: false },
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
    prices: {
      address: {
        agent: {
          lagos: { type: Number, required: false, default: ADDRESS_PRICES.AGENT.lagos },
          others: { type: Number, required: false, default: ADDRESS_PRICES.AGENT.others },
        },
        partner: {
          lagos: { type: Number, required: false, default: ADDRESS_PRICES.AGENT.lagos },
          others: { type: Number, required: false, default: ADDRESS_PRICES.AGENT.others },
        },
      },
    },
    settings: {
      'can-manage-task': { type: Boolean, required: false, default: true },
      'can-reassign-task': { type: Boolean, required: false, default: true },
      'can-manage-agents': { type: Boolean, required: false, default: true },
      'can-view-agents-task': { type: Boolean, required: false, default: true },
      'can-view-agents-location': { type: Boolean, required: false, default: true },
      'can-view-agents-activities': { type: Boolean, required: false, default: true },
      'can-view-agents-payment-activities': { type: Boolean, required: false, default: true },
    },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
PartnerSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`Partner With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'PARTNER_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IPartner>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('Partner', PartnerSchema);
};
