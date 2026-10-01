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
  };
};
