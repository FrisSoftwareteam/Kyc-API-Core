import { AdminPermissions } from '../../../core/AdminPermission';
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

const SUPER_ADMIN_PERMISSIONS = Object.values(AdminPermissions);

const ADMIN_PERMISSIONS = [
  AdminPermissions.CAN_READ_CANDIDATE,
  AdminPermissions.CAN_READ_BUSINESS,
  AdminPermissions.CAN_DELETE_BUSINESS,
  AdminPermissions.CAN_MANAGE_BUSINESS,
  AdminPermissions.CAN_READ_PARTNER,
  AdminPermissions.CAN_MANAGE_PARTNER,
  AdminPermissions.CAN_DELETE_PARTNER,
  AdminPermissions.CAN_DELETE_VERIFICATION,
  AdminPermissions.CAN_ASSIGN_VERIFICATION,
];

const USER_PERMISSIONS = [
  AdminPermissions.CAN_READ_CANDIDATE,
  AdminPermissions.CAN_DELETE_VERIFICATION,
  AdminPermissions.CAN_ASSIGN_VERIFICATION,
];

const VERIFIER_PERMISSIONS = [
  AdminPermissions.CAN_READ_CANDIDATE,
  AdminPermissions.CAN_RESPOND_VERIFICATION,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RolesPermissions: { [key: string]: any } = {
  SuperAdmin: SUPER_ADMIN_PERMISSIONS,
  Admin: ADMIN_PERMISSIONS,
  User: USER_PERMISSIONS,
  Verifier: VERIFIER_PERMISSIONS,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export default async (Model: any) => {
  const data: IDbPayload[] = [];
  Object.keys(RolesPermissions).map((item: string) => {
    data.push({
      updateOne: {
        filter: { name: item, entity: EntityType.ADMINISTRATOR },
        update: {
          name: item,
          permissions: RolesPermissions[item],
          entity: EntityType.ADMINISTRATOR,
        },
        upsert: true,
      },
    });
  });

  await Model.bulkWrite(data);

  return 'Administrator Roles Seeded successfully';
};
