import { UserType, REDIS_LOCATION_KEY } from '../constants';
import { UserStatus } from '../models/user.model';
import { BadRequestError } from '../errors/api.error';
export default class UserDataAccess {
  private readonly logger;
  private readonly UserModel;
  private readonly RedisClient;
  private readonly PartnerModel;
  private readonly BusinessModel;
  private readonly mongooseConnection;
  private readonly fillable: string;

  constructor({
    UserModel,
    BusinessModel,
    mongooseConnection,
    RedisClient,
    PartnerModel,
    logger, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.logger = logger;
    this.UserModel = UserModel;
    this.RedisClient = RedisClient;
    this.PartnerModel = PartnerModel;
    this.BusinessModel = BusinessModel;
    this.mongooseConnection = mongooseConnection;
    this.fillable = ['firstName', 'lastName', 'email', 'firstTimeLogin', 'userType'].join(' ');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createUserAccount(payload: Record<string, unknown>) {
    const { UserModel } = this;

    return (await UserModel.create(payload)).toObject();
  }

  async createBusinessUserAccount(payload: Record<string, unknown>) {
    const { logger, BusinessModel, UserModel, RedisClient, mongooseConnection } = this;

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
            country: payload.country,
            isEmailVerified: false,
            userType: UserType.BUSINESS,
            mustChangePassword: true,
          },
        ],
        { session },
      );

      await BusinessModel.findByIdAndUpdate(
        payload.businessId,
        {
          $addToSet: {
            users: {
              user: user[0]?._id,
              role: payload.role,
              status: UserStatus.ACTIVE,
            },
          },
        },
        session,
      );

      await RedisClient.hSet(
        REDIS_LOCATION_KEY.PERMISSION,
        String(user[0]?._id),
        JSON.stringify(payload.permissions),
      );

      await session.commitTransaction();

      return { ...user[0]._doc };
    } catch (error) {
      logger.error('abort transaction', error);
      await session.abortTransaction();

      throw new BadRequestError(error as string);
    } finally {
      session.endSession();
    }
  }

  async createPartnerUserAccount(payload: Record<string, unknown>) {
    const { logger, PartnerModel, UserModel, RedisClient, mongooseConnection } = this;

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
            country: payload.country,
            isEmailVerified: false,
            userType: UserType.PARTNER,
            mustChangePassword: true,
          },
        ],
        { session },
      );

      await PartnerModel.findByIdAndUpdate(
        payload.partnerId,
        {
          $addToSet: {
            users: {
              user: user[0]?._id,
              role: payload.role,
              status: UserStatus.ACTIVE,
            },
          },
        },
        session,
      );

      await RedisClient.hSet(
        REDIS_LOCATION_KEY.PERMISSION,
        String(user[0]?._id),
        JSON.stringify(payload.permissions),
      );

      await session.commitTransaction();

      return { ...user[0]._doc };
    } catch (error) {
      logger.error('abort transaction', error);
      await session.abortTransaction();

      throw new BadRequestError(error as string);
    } finally {
      session.endSession();
    }
  }

  async findUserAuthByEmail(email: string) {
    const { UserModel } = this;

    return UserModel.findOne({
      email,
    });
  }

  async findUserAuthById(id: string) {
    const { UserModel } = this;

    return UserModel.findById(id);
  }

  async updateUserById(
    id: string,
    setData: Record<string, unknown>,
    unsetData: Record<string, unknown>,
  ) {
    const { UserModel, fillable } = this;

    return UserModel.findByIdAndUpdate(
      id,
      {
        ...(setData
          ? {
              $set: setData,
            }
          : undefined),
        ...(unsetData
          ? {
              $unset: unsetData,
            }
          : undefined),
      },
      {
        new: true,
      },
    )
      .select(fillable)
      .lean()
      .exec();
  }

  async findUserAuthByTokenAndEmail(email: string, token: string) {
    const { UserModel } = this;

    return UserModel.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordTokenExpiredAt: {
        $gte: new Date(),
      },
    });
  }

  async findUserById(id: string) {
    const { UserModel } = this;

    return UserModel.findById(id);
  }
}
