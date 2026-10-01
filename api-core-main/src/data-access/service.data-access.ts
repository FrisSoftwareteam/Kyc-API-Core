import { Types } from 'mongoose';

const { ObjectId } = Types;

export default class ServiceDataAccess {
  private readonly logger;
  private readonly fillable;
  private readonly ServiceModel;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ logger, ServiceModel }: any) {
    this.logger = logger;
    this.fillable = ['name', 'slug', 'active', 'price', 'provider'].join(' ');
    this.ServiceModel = ServiceModel;
  }

  async create(payload: Record<string, unknown>) {
    const { ServiceModel } = this;

    return (await ServiceModel.create(payload)).toObject();
  }

  async findServiceById(id: string) {
    const { ServiceModel, fillable } = this;

    return ServiceModel.findById(id).select(fillable).populate('provider').lean().exec();
  }

  async findServiceBySlug(slug: string) {
    const { ServiceModel, fillable } = this;

    return ServiceModel.findOne({
      slug,
    })
      .select(fillable)
      .populate('provider')
      .lean()
      .exec();
  }

  async updateServiceById(
    id: string,
    setData: Record<string, unknown>,
    unsetData: Record<string, unknown>,
  ) {
    const { ServiceModel, fillable } = this;

    return ServiceModel.findByIdAndUpdate(
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

  async all({ status }: { status: string }) {
    const { ServiceModel } = this;

    return ServiceModel.find({
      ...(status ? { active: status } : undefined),
    });
    // return ServiceModel.aggregate([
    //   {
    //     $match: {
    //       ...(status ? { active: status } : undefined),
    //     },
    //   },
    //   {
    //     $sort: { createdAt: -1 },
    //   },
    //   {
    //     $facet: {
    //       metadata: [{ $count: 'total' }, { $addFields: { page: 1 } }],
    //       data: [{ $skip: offset }, { $limit: limit }],
    //     },
    //   },
    // ]);
  }

  async allServices() {
    const { ServiceModel } = this;

    return ServiceModel.find().lean().exec();
  }

  async findServicesByCategory(categoryId: string) {
    const { ServiceModel } = this;

    return ServiceModel.find({ category: new ObjectId(categoryId) })
      .lean()
      .exec();
  }
}
