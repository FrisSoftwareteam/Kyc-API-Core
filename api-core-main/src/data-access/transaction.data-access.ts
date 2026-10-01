import { subDays, startOfDay, endOfDay } from 'date-fns';
import * as mongoose from 'mongoose';
import { BadRequestError } from '../errors/api.error';
import {
  PaymentTypeEnum,
  PaymentProviderEnum,
  PaymentStatusEnum,
} from '../models/types/transaction.type';
import { StatusEnum } from '../models/types/task.type';
import { AddressStatusEnum } from '../models/types/address.type';
import { generateUniqueReference } from '../utils/helper';
const {
  Types: { ObjectId },
} = mongoose;

export default class TransactionDataAccess {
  private readonly logger;
  private readonly fillable;
  private readonly BusinessModel;
  private readonly TaskModel;
  private readonly AddressModel;
  private readonly TransactionModel;
  private readonly mongooseConnection;

  constructor({
    logger,
    BusinessModel,
    TransactionModel,
    mongooseConnection,
    AddressModel,
    TaskModel, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.logger = logger;
    this.fillable = ['user', 'business', 'task', 'amount', 'type', 'status', 'paidAt'].join(' ');
    this.BusinessModel = BusinessModel;
    this.TaskModel = TaskModel;
    this.AddressModel = AddressModel;
    this.TransactionModel = TransactionModel;
    this.mongooseConnection = mongooseConnection;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async chargeBusinessTransaction(taskId: string, userId: string, business: any, cost: number) {
    const { logger, mongooseConnection } = this;

    const session = await mongooseConnection.startSession();

    session.withTransaction();

    try {
      await this.chargeBusiness(taskId, userId, business, cost, session);

      await session.commitTransaction();

      return { ...business[0]._doc };
    } catch (error) {
      logger.error('abort transaction', error);
      await session.abortTransaction();

      throw new BadRequestError(error as string);
    } finally {
      session.endSession();
    }
  }

  async chargeBusiness(
    taskId: string,
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    businessId: any,
    cost: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session?: any,
  ) {
    const { TransactionModel, BusinessModel } = this;

    const business = await BusinessModel.findById(businessId);

    if (!business) {
      throw new BadRequestError('Invalid Business ID', { code: 'INVALID_BUSINESS_ID' });
    }

    const walletBalance = business?.wallet?.balance || 0;
    const walletBookBalance = business?.wallet?.bookBalance || 0;

    await BusinessModel.findByIdAndUpdate(
      business._id,
      {
        $set: {
          wallet: {
            outstandingBalance:
              walletBalance < cost ? walletBalance - cost : business?.wallet?.outstandingBalance,
            balance: walletBalance - cost < 0 ? 0 : walletBalance - cost,
            bookBalance: walletBookBalance - cost < 0 ? 0 : walletBookBalance - cost,
          },
        },
      },
      { session },
    );

    await TransactionModel.create(
      [
        {
          user: userId,
          business: business._id,
          task: taskId,
          amount: cost,
          type: PaymentTypeEnum.DEBIT,
          reference: generateUniqueReference('task'),
          paidAt: new Date(),
          provider: PaymentProviderEnum.WALLET,
          status: PaymentStatusEnum.SUCCESSFUL,
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async refundBusiness(address: any, session?: any) {
    const { logger, TaskModel, AddressModel, BusinessModel, TransactionModel, mongooseConnection } =
      this;

    if (!session) {
      session = await mongooseConnection.startSession();

      session.startTransaction();
    }

    try {
      const { _id: addressId, task: taskData } = address;
      const { _id: taskId, user, business: buisnessId, cost } = taskData;

      const business = await BusinessModel.findById(buisnessId);

      if (!business) {
        throw new BadRequestError('Invalid Business ID', { code: 'INVALID_BUSINESS_ID' });
      }

      const walletBalance = business?.wallet?.balance || 0;
      const walletBookBalance = business?.wallet?.bookBalance || 0;

      await BusinessModel.findByIdAndUpdate(business._id, {
        $set: {
          wallet: {
            balance: walletBalance + cost,
            bookBalance: walletBookBalance + cost,
          },
        },
      }).session(session);

      await AddressModel.findByIdAndUpdate(addressId, {
        $set: {
          status: AddressStatusEnum.REJECTED,
        },
      }).session(session);

      await TaskModel.findByIdAndUpdate(taskId, {
        $set: {
          status: StatusEnum.REJECTED,
        },
      }).session(session);

      await TransactionModel.create(
        [
          {
            user,
            business: business._id,
            task: taskId,
            amount: cost,
            type: PaymentTypeEnum.REFUND,
            reference: generateUniqueReference('task'),
            paidAt: new Date(),
            provider: PaymentProviderEnum.WALLET,
            status: PaymentStatusEnum.SUCCESSFUL,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return true;
    } catch (error) {
      logger.error('abort transaction', error);
      await session.abortTransaction();

      throw new BadRequestError(error as string);
    } finally {
      session.endSession();
    }
  }

  async create(payload: Record<string, unknown>) {
    const { TransactionModel } = this;

    return (await TransactionModel.create(payload)).toObject();
  }

  async findTransactionById(id: string) {
    const { TransactionModel, fillable } = this;

    return TransactionModel.findById(id).select(fillable).lean().exec();
  }

  async sumAllVerifications(businessId: string) {
    const { TransactionModel } = this;

    return TransactionModel.aggregate([
      {
        $match: {
          business: new ObjectId(businessId),
          status: PaymentStatusEnum.SUCCESSFUL,
          type: PaymentTypeEnum.DEBIT,
        },
      },
      {
        $group: {
          _id: null,
          sum: {
            $sum: {
              $toInt: '$amount',
            },
          },
        },
      },
      {
        $project: {
          _id: null,
          sum: 1,
        },
      },
    ]);
  }

  async findTransactionBySlug(slug: string) {
    const { TransactionModel, fillable } = this;

    return TransactionModel.findOne({
      slug,
    })
      .select(fillable)
      .lean()
      .exec();
  }

  async findTransactionByReference(reference: string) {
    const { TransactionModel, fillable } = this;

    return TransactionModel.findOne({
      reference,
    })
      .select(fillable)
      .lean()
      .exec();
  }

  async updateOneTransaction(
    payload: Record<string, unknown>,
    setData: Record<string, unknown>,
    unsetData: Record<string, unknown>,
  ) {
    const { TransactionModel, fillable } = this;

    return TransactionModel.findOneAndUpdate(
      payload,
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

  async updateTransaction(
    reference: string,
    setData: Record<string, unknown>,
    unsetData: Record<string, unknown>,
  ) {
    const { TransactionModel, fillable } = this;

    return TransactionModel.findOneAndUpdate(
      {
        reference,
      },
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

  async all({ status }: { status: string }, { offset, limit }: { offset: number; limit: number }) {
    const { TransactionModel } = this;

    return TransactionModel.aggregate([
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

  async calculateTotalVerificationCost(businessId: string) {
    const { TransactionModel } = this;

    return TransactionModel.aggregate([
      {
        $match: {
          business: businessId,
          type: PaymentTypeEnum.DEBIT,
        },
      },
      {
        $group: {
          _id: null,
          cost: {
            $sum: '$amount',
          },
        },
      },
    ]);
  }

  async allBusinessTransactions(
    businessId: string,
    {
      period,
      status,
      type,
      customStartDate,
      customEndDate,
    }: {
      period: number;
      status: string;
      type: string;
      search: string;
      customStartDate: string;
      customEndDate: string;
    },
    { offset, limit }: { offset: number; limit: number },
  ) {
    const { TransactionModel } = this;

    const stoppedDate = subDays(new Date(), period);
    const startDate = startOfDay(stoppedDate);

    return TransactionModel.aggregate([
      {
        $match: {
          business: businessId,
          ...(type
            ? {
                type,
              }
            : undefined),
          ...(status ? { status } : undefined),
          ...(period && (!customStartDate || !customEndDate)
            ? {
                createdAt: {
                  $gte: startDate,
                  $lte: new Date(),
                },
              }
            : undefined),
          ...(customStartDate && customEndDate
            ? {
                createdAt: {
                  $gte: new Date(customStartDate),
                  $lte: endOfDay(new Date(customEndDate)),
                },
              }
            : undefined),
        },
      },
      {
        $lookup: {
          from: 'businesses',
          localField: 'business',
          foreignField: '_id',
          as: 'business',
        },
      },
      {
        $lookup: {
          from: 'tasks',
          localField: 'task',
          foreignField: '_id',
          as: 'task',
          pipeline: [
            {
              $lookup: {
                from: 'candidates',
                localField: 'candidate',
                foreignField: '_id',
                as: 'candidate',
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $lookup: {
          from: 'addresses',
          localField: '_id',
          foreignField: 'task',
          as: 'address',
        },
      },
      {
        $lookup: {
          from: 'identities',
          localField: '_id',
          foreignField: 'task',
          as: 'identity',
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }, { $addFields: { page: 1 } }],
          data: [{ $skip: offset }, { $limit: limit }],
        },
      },
    ]);
  }
}
