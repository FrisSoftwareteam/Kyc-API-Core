import { BusinessPermissions } from '../../../core/BusinessPermission';
import { EntityType } from '../../../models/role.model';

type IDbPayload = {
  updateOne: {
    filter: {
      name: string;
      entity: EntityType;
    };
    update: {
      name: string;
      entity: EntityType;
      permissions: string[];
    };
    upsert: boolean;
  };
};

const SUPER_ADMIN_PERMISSIONS = Object.values(BusinessPermissions);

const ADMIN_PERMISSIONS = [
  BusinessPermissions.CAN_CREATE_VERIFICATIONS,
  BusinessPermissions.CAN_VIEW_VERIFICATIONS,
  BusinessPermissions.CAN_FUND_WALLET,
  BusinessPermissions.CAN_READ_USERS,
  BusinessPermissions.CAN_CREATE_USERS,
  BusinessPermissions.CAN_DELETE_USERS,
];

const USER_PERMISSIONS = [
  BusinessPermissions.CAN_CREATE_VERIFICATIONS,
  BusinessPermissions.CAN_VIEW_VERIFICATIONS,
  BusinessPermissions.CAN_FUND_WALLET,
  BusinessPermissions.CAN_READ_USERS,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RolesPermissions: { [key: string]: any } = {
  SuperAdmin: SUPER_ADMIN_PERMISSIONS,
  Admin: ADMIN_PERMISSIONS,
  User: USER_PERMISSIONS,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async (Model: any) => {
  const data: IDbPayload[] = [];
  Object.keys(RolesPermissions).map((item: string) => {
    data.push({
      updateOne: {
        filter: { name: item, entity: EntityType.BUSINESS },
        update: {
          name: item,
          permissions: RolesPermissions[item],
          entity: EntityType.BUSINESS,
        },
        upsert: true,
      },
    });
  });

  await Model.bulkWrite(data);

  return 'Business Roles Seeded successfully';
};
