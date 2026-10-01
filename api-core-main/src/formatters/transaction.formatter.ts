import AddressFormatter, { IAddressFormatter } from './address.formatter';
import UserFormatter, { IUserFormatter } from './user.formatter';
import IdentityFormatter, { IIdentityFormatter } from './identity.formatter';
import TaskFormatter, { ITaskFormatter } from './task.formatter';

export interface ITransactionFormatter {
  user: IUserFormatter;
  address?: IAddressFormatter;
  identity?: IIdentityFormatter;
  task?: ITaskFormatter;
  verificationType: string;
  status: string;
  amount: string;
  type: string;
  reference: string;
  createdAt: string;
  _id: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ transaction }: any): ITransactionFormatter => {
  return {
    verificationType: transaction?.verifications ? transaction?.verifications.join(',') : undefined,
    status: transaction?.status,
    amount: transaction?.amount,
    type: transaction?.type,
    reference: transaction?.reference,
    createdAt: transaction?.createdAt,
    _id: transaction?._id,
    address: transaction?.address ? AddressFormatter({ address: transaction?.address }) : undefined,
    identity: transaction?.identity
      ? IdentityFormatter({ identity: transaction?.identity })
      : undefined,
    task: transaction?.task ? TaskFormatter({ task: transaction?.task }) : undefined,
    user: UserFormatter({ user: transaction?.user }),
  };
};
