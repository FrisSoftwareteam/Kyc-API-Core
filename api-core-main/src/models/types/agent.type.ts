import Partner from '../partner.model';
import User from '../user.model';

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum AgentOnlineStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export interface IAgent {
  partner: typeof Partner;
  user: typeof User;
  status: AgentStatus;
  onlineStatus: AgentOnlineStatus;
  fcmTokens: string[];
  eventId: string;
  imageUrl: string;
  state: string;
  wallet: {
    outstandingPayment?: number;
    withdrawableAmount?: number;
    totalPaid?: number;
  };
  bank: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    recipientCode: string;
  };
}
