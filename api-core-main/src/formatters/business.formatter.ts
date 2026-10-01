import { COUNTRY_CODES_NAMES_LOOKUP } from '../constants';
import UserFormatter, { IUserFormatter } from './user.formatter';
export interface IBusinessFormatter {
  _id: string;
  name: string;
  email: string;
  address: string;
  cacNumber: string;
  active: boolean;
  directorNin: string;
  country: {
    code: string;
    name: string;
  };
  mainUser: IUserFormatter;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ business }: any): IBusinessFormatter => {
  return {
    _id: business?._id,
    name: business?.name,
    email: business?.email,
    address: business?.address,
    cacNumber: business?.cacNumber,
    directorNin: business?.directorNin,
    active: business?.active,
    country: {
      code: business?.countryCode,
      name: COUNTRY_CODES_NAMES_LOOKUP.get(business?.countryCode) as string,
    },
    mainUser: UserFormatter({ user: business?.user }),
    createdAt: business?.createdAt,
  };
};
