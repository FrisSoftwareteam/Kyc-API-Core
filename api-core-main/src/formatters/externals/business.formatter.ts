import { COUNTRY_CODES_NAMES_LOOKUP } from '../../constants';
import UserFormatter, { IUserFormatter } from './user.formatter';

export interface IBusinessFormatter {
  _id: string;
  name: string;
  email: string;
  address: string;
  country: {
    code: string;
    name: string;
  };
  mainUser: IUserFormatter;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ business }: any): IBusinessFormatter => {
  return {
    _id: business?._id,
    name: business?.name,
    email: business?.email,
    address: business?.address,
    country: {
      code: business?.countryCode,
      name: COUNTRY_CODES_NAMES_LOOKUP.get(business?.countryCode) as string,
    },
    mainUser: UserFormatter({ user: business?.user }),
  };
};
