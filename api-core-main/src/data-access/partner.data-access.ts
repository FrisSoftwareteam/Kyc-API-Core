import * as mongoose from 'mongoose';
import { startOfDay, endOfDay } from 'date-fns';
import { BadRequestError } from '../errors/api.error';
import { UserType, COUNTRY_CODES_NAMES_LOOKUP } from '../constants';
import { UserStatus } from '../models/user.model';
import { AgentStatus } from '../models/types/agent.type';

const {
  Types: { ObjectId },
} = mongoose;

export default class PartnerDataAccess {
  private readonly logger;
  private readonly fillable;
  private readonly PartnerModel;
  private readonly UserModel;
  private readonly InviteModel;
  private readonly AgentModel;
  private readonly mongooseConnection;

  constructor({
    logger,
    PartnerModel,
    InviteModel,
    UserModel,
    AgentModel,
    mongooseConnection, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.logger = logger;
    this.fillable = [
      'name',
      'user',
      'email',
      'users',
      'bank',
      'active',
      'prices',
      'states',
      'active',
      'wallet',
      'address',
      'settings',
      'countryCode',
      'phoneNumber',
    ].join(' ');
    this.PartnerModel = PartnerModel;
    this.InviteModel = InviteModel;
    this.UserModel = UserModel;
    this.AgentModel = AgentModel;
    this.mongooseConnection = mongooseConnection;
  }

  async invitePartner(payload: Record<string, unknown>, inviteObject: Record<string, unknown>) {
    const { logger, InviteModel, PartnerModel, mongooseConnection } = this;

    const session = await mongooseConnection.startSession();

    session.startTransaction();

    try {
      const partner = await PartnerModel.create([payload], { session });
      const invite = await InviteModel.create(
        [
          {
            email: payload.email,
            requestPayload: payload,
            inviteToken: inviteObject.inviteToken,
            inviteTokenExpiry: inviteObject.inviteTokenExpiry,
            type: UserType.PARTNER,
            modelId: partner[0]._id,
          },
        ],
        session,
      );

      await session.commitTransaction();

      return { ...partner[0]._doc, inviteId: invite[0]._id };
    } catch (error) {
      logger.error('abort transaction', error);
      await session.abortTransaction();

      throw new BadRequestError(error as string);
    } finally {
      session.endSession();
    }
  }

  async completePartnerSignup(payload: Record<string, unknown>) {
    const { logger, InviteModel, PartnerModel, UserModel, mongooseConnection } = this;

    const session = await mongooseConnection.startSession();

    session.startTransaction();

    try {
      const invite = await InviteModel.findOne({
        inviteToken: payload.inviteToken,
        inviteTokenExpiry: {
          $gte: new Date(),
        },
      });

      if (!invite) {
        throw new BadRequestError('Invalid Invite Token', {
          code: 'INVALID_INVITE_TOKEN',
        });
      }

      const user = await UserModel.create(
        [
          {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phoneNumber: payload.phoneNumber,
            password: payload.password,
            userType: UserType.PARTNER,
            country: {
              code: invite.requestPayload.get('countryCode'),
              name: COUNTRY_CODES_NAMES_LOOKUP.get(invite.requestPayload.get('countryCode')),
            },
          },
        ],
        { session },
      );

      await PartnerModel.findByIdAndUpdate(
        invite.modelId,
        {
          $set: {
            user: user[0]._id,
          },
          $addToSet: {
            users: {
              user: user[0]?._id,
              role: payload.role,
              status: UserStatus.ACTIVE,
            },
          },
        },
        { new: true },
        { session },
      );

      await InviteModel.findByIdAndDelete(invite._id);

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

  async invitePartnerAgent(
    payload: Record<string, unknown>,
    inviteObject: Record<string, unknown>,
  ) {
    const { logger, InviteModel, mongooseConnection } = this;

    const session = await mongooseConnection.startSession();

    session.startTransaction();

    try {
      const invite = await InviteModel.create(
        [
          {
            email: payload.email,
            requestPayload: payload,
            inviteToken: inviteObject.inviteToken,
            inviteTokenExpiry: inviteObject.inviteTokenExpiry,
            type: UserType.AGENT,
            modelId: payload?.partner,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return invite[0]._doc;
    } catch (error) {
      logger.error('abort transaction', error);
      await session.abortTransaction();

      throw new BadRequestError(error as string);
    } finally {
      session.endSession();
    }
  }

  async createPartnerAgent(payload: Record<string, unknown>) {
    const { logger, UserModel, AgentModel, mongooseConnection } = this;

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
            userType: UserType.AGENT,
            country: {
              code: payload.countryCode,
              name: COUNTRY_CODES_NAMES_LOOKUP.get(payload.countryCode as string),
            },
          },
        ],
        { session },
      );

      const agentByNin = await AgentModel.findOne({ nin: payload.nin });

      if (agentByNin) {
        throw new BadRequestError('Agent with same nin exists', {
          code: 'AGENT_NIN_EXISTS',
        });
      }

      const agent = await AgentModel.create(
        [
          {
            user: user[0]._id,
            nin: payload.nin,
            partner: payload.partner,
            state: payload.state,
            status: AgentStatus.ACTIVE,
          },
        ],
        { session },
      );

      await AgentModel.findByIdAndUpdate(agent[0]._id, {
        $set: {
          eventId: String(agent[0]._id),
        },
      });

      await session.commitTransaction();

      return { ...user[0]._doc, agentId: agent[0]._id };
    } catch (error) {
      logger.error('abort transaction', error);
      await session.abortTransaction();

      throw new BadRequestError(error as string);
    } finally {
      session.endSession();
    }
  }

  async createPartnerAgentByInvite(payload: Record<string, unknown>) {
    const { logger, InviteModel, UserModel, AgentModel, mongooseConnection } = this;

    const session = await mongooseConnection.startSession();

    session.startTransaction();

    try {
      const invite = await InviteModel.findOne({
        inviteToken: payload.inviteToken,
        inviteTokenExpiry: {
          $gte: new Date(),
        },
      });

      if (!invite) {
        throw new BadRequestError('Invalid Invite Token', {
          code: 'INVALID_INVITE_TOKEN',
        });
      }

      const user = await UserModel.create(
        [
          {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: invite.requestPayload.get('email'),
            phoneNumber: payload.phoneNumber,
            password: payload.password,
            userType: UserType.AGENT,
            country: {
              code: invite.requestPayload.get('country'),
              name: COUNTRY_CODES_NAMES_LOOKUP.get(invite.requestPayload.get('country')),
            },
          },
        ],
        { session },
      );

      const agent = await AgentModel.create(
        [
          {
            user: user[0]._id,
            partner: payload.partner,
            status: AgentStatus.ACTIVE,
          },
        ],
        { session },
      );

      await InviteModel.findByIdAndDelete(invite._id);

      await session.commitTransaction();

      return { ...user[0]._doc, agentId: agent[0]._id };
    } catch (error) {
      logger.error('abort transaction', error);
      await session.abortTransaction();

      throw new BadRequestError(error as string);
    } finally {
      session.endSession();
    }
  }

  async findUserPartnerByUserId(userId: string) {
    const { PartnerModel, fillable } = this;

    return PartnerModel.findOne({
      $or: [
        { user: new ObjectId(userId) },
        { 'users.user': new ObjectId(userId), 'users.status': UserStatus.ACTIVE },
      ],
    })
      .populate({
        path: 'user',
      })
      .select(fillable)
      .lean()
      .exec();
  }

  async findPartnerById(id: string) {
    const { PartnerModel, fillable } = this;

    return PartnerModel.findById(id)
      .select(fillable)
      .populate('user')
      .populate('users.user')
      .populate('users.role')
      .lean()
      .exec();
  }

  async updatePartnerById(
    id: string,
    setData: Record<string, unknown>,
    unsetData: Record<string, unknown>,
  ) {
    const { PartnerModel, fillable } = this;

    return PartnerModel.findByIdAndUpdate(
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

  async all(
    {
      status,
    }: {
      status: string;
    },
    { offset, limit }: { offset: number; limit: number },
  ) {
    const { PartnerModel } = this;

    return PartnerModel.aggregate([
      {
        $match: {
          ...(status ? { active: status } : undefined),
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }, { $addFields: { page: 1 } }],
          data: [{ $skip: offset }, { $limit: limit }],
        },
      },
    ]);
  }

  async pushAdminUsers(id: string, setData: Record<string, unknown>) {
    const { PartnerModel, fillable } = this;

    return PartnerModel.findByIdAndUpdate(
      id,
      {
        ...(setData
          ? {
              $push: setData,
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

  async findBusinessByBusinessUserId(businessUserId: string) {
    const { PartnerModel, fillable } = this;

    return PartnerModel.findOne({
      'users._id': businessUserId,
    })
      .select(fillable)
      .lean()
      .exec();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async allPartners(query: Record<string, unknown>) {
    const { PartnerModel, fillable } = this;

    return PartnerModel.find().select(fillable).lean().exec();
  }

  async countAllAgents(partnerId: string) {
    const { AgentModel } = this;

    return AgentModel.countDocuments({
      partner: partnerId,
    });
  }

  async updateUserStatus(businessId: string, businessUserId: string) {
    const { PartnerModel, fillable } = this;

    return PartnerModel.findOneAndUpdate(
      {
        _id: businessId,
        'users._id': businessUserId,
      },
      {
        $set: {
          'users.$.status': UserStatus.ACTIVE,
        },
      },
    )
      .select(fillable)
      .lean()
      .exec();
  }

  async updatePartnerUserRole(partnerId: string, userId: string, role: string) {
    const { PartnerModel, fillable } = this;

    return PartnerModel.findOneAndUpdate(
      {
        _id: partnerId,
        'users.user': userId,
      },
      {
        $set: {
          'users.$.role': role,
        },
      },
    )
      .select(fillable)
      .lean()
      .exec();
  }

  async suspendPartnerUser(partnerId: string, userId: string) {
    const { PartnerModel } = this;

    return PartnerModel.findOneAndUpdate(
      {
        _id: partnerId,
        'users.user': userId,
      },
      {
        $set: {
          'users.$.status': UserStatus.SUSPENDED,
        },
      },
    );
  }

  async restorePartnerUser(partnerId: string, userId: string) {
    const { PartnerModel } = this;

    return PartnerModel.findOneAndUpdate(
      {
        _id: partnerId,
        'users.user': userId,
      },
      {
        $set: {
          'users.$.status': UserStatus.ACTIVE,
        },
      },
    );
  }

  async findAllPartnerInState(state: string) {
    const { PartnerModel } = this;

    return PartnerModel.find({
      // states: state,
      states: { $regex: state, $options: 'i' },
    })
      .lean()
      .exec();
  }

  async disablePartner(partnerId: string) {
    const { PartnerModel } = this;

    return PartnerModel.findOneAndUpdate(
      {
        _id: partnerId,
      },
      {
        $set: {
          active: false,
        },
      },
    );
  }

  async restorePartner(partnerId: string) {
    const { PartnerModel } = this;

    return PartnerModel.findOneAndUpdate(
      {
        _id: partnerId,
      },
      {
        $set: {
          active: true,
        },
      },
    );
  }

  countAllPartners(query: Record<string, unknown>) {
    const { PartnerModel } = this;

    const { customEndDate, customStartDate } = query;

    return PartnerModel.countDocuments({
      ...(customEndDate && customStartDate
        ? {
            createdAt: {
              $gte: startOfDay(String(customStartDate)),
              $lte: endOfDay(String(customEndDate)),
            },
          }
        : undefined),
    });
  }
}
