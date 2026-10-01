import { Schema, ErrorHandlingMiddlewareFunction } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ConflictError } from '../errors/api.error';
import { ICountry, IPhoneNumber, UserType } from '../constants';

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export interface IUser {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: IPhoneNumber;
  referralCode?: string;
  lastLogin?: Date;
  country: ICountry;
  password: string;
  resetPasswordToken: string;
  resetPasswordTokenExpiredAt: Date;
  isPhoneNumberVerified?: boolean;
  isEmailVerified?: boolean;
  mustChangePassword?: boolean;
  firstTimeLogin?: boolean;
  userType: UserType;
  status: UserStatus;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    middleName: { type: String, required: false },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phoneNumber: {
      countryCode: { type: String, required: true },
      number: { type: String, required: true, unique: true },
    },
    lastLogin: { type: Date },
    password: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordTokenExpiredAt: { type: Date },
    country: {
      name: { type: String, required: true },
      code: { type: String, required: true },
    },
    userType: { type: String, enum: UserType, default: UserType.BUSINESS },
    status: { type: String, enum: UserStatus, default: UserStatus.ACTIVE },
    isEmailVerified: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: false },
    firstTimeLogin: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
UserSchema.post('save', function (error: any, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const objectKeys: string[] = [];

    for (const item in error.keyPattern) {
      objectKeys.push(item);
    }
    next(
      new ConflictError(`User With ${objectKeys.join(' ').split(',')} already exists`, {
        code: 'USER_ALREADY_EXISTS',
      }),
    );
  } else {
    next();
  }
} as ErrorHandlingMiddlewareFunction<IUser>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.set('password', await bcrypt.hash(this.password, 10));
    next();
  }
});

UserSchema.virtual('fullName').get(function () {
  let name: string = this.lastName;

  if (this.middleName) {
    name += ` ${this.middleName}`;
  }

  return `${name} ${this.firstName}`;
});

UserSchema.methods.comparePasswords = async function (password: string, userPassword: string) {
  const isMatch = await bcrypt.compare(password, userPassword);

  return isMatch;
};

UserSchema.methods.hashPassword = async function (password: string) {
  return await bcrypt.hash(password, 10);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ mongooseConnection }: Record<string, any>) => {
  return mongooseConnection.model('User', UserSchema);
};
