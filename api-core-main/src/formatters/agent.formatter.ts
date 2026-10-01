import UserFormatter, { IUserFormatter } from './user.formatter';
import PartnerFormatter, { IPartnerFormatter } from './partner.formatter';

export interface IAgentFormatter {
  _id: string;
  status: string;
  onlineStatus: string;
  realtimeStatus?: string;
  imageUrl: string;
  eventId: string;
  state: string;
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
  user: IUserFormatter;
  partner: IPartnerFormatter;
  createdAt: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ agent }: any): IAgentFormatter => {
  return {
    _id: agent?._id,
    status: agent?.status,
    onlineStatus: agent?.onlineStatus,
    eventId: agent?.eventId,
    imageUrl: agent?.imageUrl,
    createdAt: agent?.createdAt,
    realtimeStatus: agent?.realtimeStatus,
    state: agent?.state?.toUpperCase(),
    wallet: {
      outstanding: agent?.wallet?.outstandingPayment || 0,
      withdrawable: agent?.wallet?.withdrawableAmount || 0,
      totalPaidOut: agent?.wallet?.totalPaid || 0,
    },
    bank: {
      bankName: agent?.bank?.bankName || 'N/A',
      accountName: agent?.bank?.accountName || 'N/A',
      accountNumber: agent?.bank?.accountNumber || 'N/A',
    },
    user: UserFormatter({ user: Array.isArray(agent?.user) ? agent?.user[0] : agent?.user }),
    partner: PartnerFormatter({ partner: agent?.partner }),
  };
};
