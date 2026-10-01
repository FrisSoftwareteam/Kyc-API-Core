import UserFormatter, { IUserFormatter } from './user.formatter';
import RoleFormatter, { IRoleFormatter } from './role.formatter';

export interface IPartnerUserFormatter {
  _id: string;
  status: string;
  user: IUserFormatter;
  role: IRoleFormatter;
  createdAt: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ partnerUser }: any): IPartnerUserFormatter => {
  return {
    _id: partnerUser?._id,
    status: partnerUser?.status,
    role: RoleFormatter({ role: partnerUser?.role }),
    user: UserFormatter({ user: partnerUser?.user }),
    createdAt: partnerUser.createdAt,
  };
};
