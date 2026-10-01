import { COUNTRY_CODES_NAMES_LOOKUP } from '../constants';
import UserFormatter, { IUserFormatter } from './user.formatter';
export interface IPartnerFormatter {
  _id: string;
  name: string;
  email: string;
  states: string[];
  address: string;
  phoneNumber: {
    countryCode: string;
    number: string;
  };
  active: boolean;
  prices: object;
  cacNumber: string;
  directorNin: string;
  mainUser: IUserFormatter;
  country: {
    code: string;
    name: string;
  };
  wallet: {
    outstanding: number;
    withdrawable: number;
    totalPaidOut: number;
  };
  bank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  settings: {
    [key: string]: boolean;
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ partner }: any): IPartnerFormatter => {
  return {
    _id: partner?._id,
    name: partner?.name,
    email: partner?.email,
    address: partner?.address,
    phoneNumber: partner?.phoneNumber,
    active: partner?.active,
    prices: partner?.prices,
    cacNumber: partner?.cacNumber,
    directorNin: partner?.directorNin,
    mainUser: UserFormatter({ user: partner?.user }),
    country: {
      code: partner?.countryCode,
      name: COUNTRY_CODES_NAMES_LOOKUP.get(partner?.countryCode) as string,
    },
    wallet: {
      outstanding: partner?.wallet?.outstandingPayment || 0,
      withdrawable: partner?.wallet?.withdrawableAmount || 0,
      totalPaidOut: partner?.wallet?.totalPaid || 0,
    },
    bank: {
      bankName: partner?.bank?.bankName || 'N/A',
      accountName: partner?.bank?.accountName || 'N/A',
      accountNumber: partner?.bank?.accountNumber || 'N/A',
    },
    states: partner?.states,
    settings: partner?.settings,
  };
};
