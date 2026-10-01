import { EntityType } from '../models/role.model';

export default class RoleDataAccess {
  private readonly RoleModel;
  private readonly fillable: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ RoleModel }: any) {
    this.RoleModel = RoleModel;
    this.fillable = ['name', 'country', 'permissions'].join(' ');
  }

  async create(payload: Record<string, unknown>) {
    const { RoleModel } = this;

    return (await RoleModel.create(payload)).toObject();
  }

  async getRoleByUserAndId(userId: string, roleId: string) {
    const { RoleModel, fillable } = this;

    return RoleModel.find({
      user: userId,
      role: roleId,
    })
      .select(fillable)
      .lean()
      .exec();
  }

  async getRoleByName(name: string) {
    const { RoleModel, fillable } = this;

    return RoleModel.findOne({
      name,
      entity: EntityType.ADMINISTRATOR,
    })
      .select(fillable)
      .lean()
      .exec();
  }

  async getRoleById(id: string) {
    const { RoleModel, fillable } = this;

    return RoleModel.findById(id).select(fillable).lean().exec();
  }

  async getBusinessSuperAdminRole() {
    const { RoleModel, fillable } = this;

    return RoleModel.findOne({
      name: 'SuperAdmin',
      entity: EntityType.BUSINESS,
    })
      .select(fillable)
      .lean()
      .exec();
  }

  async getAdminSuperAdminsRole() {
    const { RoleModel, fillable } = this;

    return RoleModel.find({
      name: 'SuperAdmin',
      entity: EntityType.ADMINISTRATOR,
    })
      .select(fillable)
      .lean()
      .exec();
  }

  async getAdminSuperAdminRole() {
    const { RoleModel, fillable } = this;

    return RoleModel.findOne({
      name: 'SuperAdmin',
      entity: EntityType.ADMINISTRATOR,
    })
      .select(fillable)
      .lean()
      .exec();
  }

  async getPartnerSuperAdminRole() {
    const { RoleModel, fillable } = this;

    return RoleModel.findOne({
      name: 'SuperAdmin',
      entity: EntityType.PARTNER,
    })
      .select(fillable)
      .lean()
      .exec();
  }

  async allRoles() {
    const { RoleModel, fillable } = this;

    return RoleModel.find().select(fillable).lean().exec();
  }

  async allBusinessRoles() {
    const { RoleModel, fillable } = this;

    return RoleModel.find({
      entity: EntityType.BUSINESS,
    })
      .select(fillable)
      .lean()
      .exec();
  }

  async allPartnerRoles() {
    const { RoleModel, fillable } = this;

    return RoleModel.find({
      entity: EntityType.PARTNER,
    })
      .select(fillable)
      .lean()
      .exec();
  }

  async allAdminRoles() {
    const { RoleModel, fillable } = this;

    return RoleModel.find({
      entity: EntityType.ADMINISTRATOR,
    })
      .select(fillable)
      .lean()
      .exec();
  }

  async updateRoleById(
    id: string,
    setData: Record<string, unknown>,
    unsetData: Record<string, unknown>,
  ) {
    const { RoleModel, fillable } = this;

    return RoleModel.findByIdAndUpdate(
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
}
