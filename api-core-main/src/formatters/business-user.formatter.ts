import UserFormatter, { IUserFormatter } from './user.formatter';
import RoleFormatter, { IRoleFormatter } from './role.formatter';

export interface IBusinessUserFormatter {
  _id: string;
  status: string;
  user: IUserFormatter;
  role: IRoleFormatter;
  createdAt: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ businessUser }: any): IBusinessUserFormatter => {
  return {
    _id: businessUser?._id,
    status: businessUser?.status,
    role: RoleFormatter({ role: businessUser?.role }),
    user: UserFormatter({ user: businessUser?.user }),
    createdAt: businessUser.createdAt,
  };
};
