import User from '../user.model';
import Role from '../role.model';

export enum AdminStatusEnum {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export interface IAdmin {
  user: typeof User;
  role: typeof Role;
  permissions: string[];
  status: AdminStatusEnum;
}
