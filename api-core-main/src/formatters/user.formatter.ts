import RoleFormatter, { IRoleFormatter } from './role.formatter';
export interface IUserFormatter {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: {
    countryCode: string;
    number: string;
  };
  userType: string;
  status: string;
  createdAt: string;
  isEmailVerified: boolean;
  firstTimeLogin: boolean;
  mustChangePassword: string;
  role?: IRoleFormatter;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ user }: any): IUserFormatter => {
  return {
    _id: user?._id,
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    phoneNumber: user?.phoneNumber,
    userType: user?.userType,
    status: user?.status,
    mustChangePassword: user?.mustChangePassword,
    isEmailVerified: user?.isEmailVerified,
    firstTimeLogin: user?.firstTimeLogin,
    createdAt: user?.createdAt,
    role: user?.role ? RoleFormatter({ role: user?.role }) : undefined,
  };
};
