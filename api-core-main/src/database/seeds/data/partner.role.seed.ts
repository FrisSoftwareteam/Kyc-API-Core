import { PartnerPermissions } from '../../../core/PartnerPermission';
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

const SUPER_ADMIN_PERMISSIONS = Object.values(PartnerPermissions);

const ADMIN_PERMISSIONS = [
  PartnerPermissions.CAN_ASSIGN_VERIFICATIONS,
  PartnerPermissions.CAN_VIEW_VERIFICATIONS,
  PartnerPermissions.CAN_READ_USERS,
  PartnerPermissions.CAN_CREATE_USERS,
  PartnerPermissions.CAN_DELETE_USERS,
];

const USER_PERMISSIONS = [
  PartnerPermissions.CAN_ASSIGN_VERIFICATIONS,
  PartnerPermissions.CAN_VIEW_VERIFICATIONS,
  PartnerPermissions.CAN_READ_USERS,
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
        filter: { name: item, entity: EntityType.PARTNER },
        update: {
          name: item,
          permissions: RolesPermissions[item],
          entity: EntityType.PARTNER,
        },
        upsert: true,
      },
    });
  });

  await Model.bulkWrite(data);

  return 'Partner Roles Seeded successfully';
};
