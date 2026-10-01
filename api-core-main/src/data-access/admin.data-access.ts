import * as mongoose from 'mongoose';
import { UserStatus } from '../models/user.model';
import { BadRequestError } from '../errors/api.error';
import { UserType, COUNTRY_CODES_NAMES_LOOKUP, COUNTRY_CODES } from '../constants';

const {
  Types: { ObjectId },
} = mongoose;

export default class AdminDataAccess {
  private readonly logger;
  private readonly fillable;
  private readonly AdminModel;
  private readonly UserModel;
  private readonly mongooseConnection;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ logger, UserModel, AdminModel, mongooseConnection }: any) {
    this.logger = logger;
    this.fillable = ['user', 'role', 'permissions', 'status'].join(' ');

    this.UserModel = UserModel;
    this.AdminModel = AdminModel;
    this.mongooseConnection = mongooseConnection;
  }

  async createAdmin(payload: Record<string, unknown>) {
    const { logger, AdminModel, UserModel, mongooseConnection } = this;

    const session = await mongooseConnection.startSession();

    session.startTransaction();

    try {
      const user = await UserModel.create(
        [
          {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phoneNumber: payload.phoneNumber,
            password: payload.password,
            userType: UserType.ADMINISTRATOR,
            country: {
              code: (payload.countryCode as string) || COUNTRY_CODES.NG,
              name: COUNTRY_CODES_NAMES_LOOKUP.get(
                (payload.countryCode as string) || COUNTRY_CODES.NG,
              ),
            },
          },
        ],
        { session },
      );

      const admin = await AdminModel.create(
        [
          {
            user: user[0]._id,
            role: payload.role,
            permissions: payload.permissions,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return { ...user[0]._doc, adminId: admin[0]._id };
    } catch (error) {
      logger.error('abort transaction', error);
      await session.abortTransaction();

      throw new BadRequestError(error as string);
    } finally {
      session.endSession();
    }
  }

  async findAdminById(id: string) {
    const { AdminModel, fillable } = this;

    return AdminModel.findById(id).select(fillable).lean().exec();
  }

  async findUserAdminById(id: string) {
    const { AdminModel, fillable } = this;

    return AdminModel.findById(id)
      .select(fillable)
      .populate({
        path: 'user',
      })
      .populate({
        path: 'role',
      })
      .lean()
      .exec();
  }

  async adminUsers(roleId: string) {
    const { AdminModel, fillable } = this;

    return AdminModel.find({
      ...(roleId ? { role: roleId } : undefined),
    })
      .select(fillable)
      .populate({
        path: 'user',
      })
      .populate({
        path: 'role',
      })
      .lean()
      .exec();
  }

  async findAdminByUserId(id: string) {
    const { AdminModel, fillable } = this;

    return AdminModel.findOne({
      user: id,
    })
      .select(fillable)
      .populate('user')
      .lean()
      .exec();
  }

  async findAdminByUserIds(ids: string[]) {
    const { AdminModel, fillable } = this;

    return AdminModel.find({
      role: {
        $in: ids,
      },
    })
      .populate({
        path: 'user',
      })
      .select(fillable)
      .lean()
      .exec();
  }

  async getRoleByUserAndId(userId: string, roleId: string) {
    const { AdminModel, fillable } = this;

    return AdminModel.findOne({
      user: new ObjectId(userId),
      role: roleId,
    })
      .select(fillable)
      .populate({
        path: 'user',
      })
      .lean()
      .exec();
  }

  async suspendAdminUser(user: string) {
    const { AdminModel, UserModel } = this;

    await UserModel.findOneAndUpdate(
      {
        _id: new ObjectId(user),
      },
      {
        $set: {
          status: UserStatus.SUSPENDED,
        },
      },
    );

    return AdminModel.findOneAndUpdate(
      {
        user: new ObjectId(user),
      },
      {
        $set: {
          status: UserStatus.SUSPENDED,
        },
      },
    );
  }

  async restoreAdminUser(user: string) {
    const { AdminModel, UserModel } = this;

    await UserModel.findOneAndUpdate(
      {
        _id: new ObjectId(user),
      },
      {
        $set: {
          status: UserStatus.ACTIVE,
        },
      },
    );

    return AdminModel.findOneAndUpdate(
      {
        user: new ObjectId(user),
      },
      {
        $set: {
          status: UserStatus.ACTIVE,
        },
      },
    );
  }

  async updateAdminUserRole(userId: string, role: string, permissions: string[]) {
    const { AdminModel, fillable } = this;

    return AdminModel.findOneAndUpdate(
      {
        user: new ObjectId(userId),
      },
      {
        $set: {
          permissions,
          role: new ObjectId(role),
        },
      },
    )
      .select(fillable)
      .lean()
      .exec();
  }
}
