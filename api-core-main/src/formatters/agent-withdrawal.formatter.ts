export interface IAgentWithdrawalFormatter {
  status: string;
  amount: string;
  reference: string;
  type: string;
  createdAt: string;
  _id: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ withdrawal }: any): IAgentWithdrawalFormatter => {
  return {
    status: withdrawal?.status,
    amount: withdrawal?.amount,
    reference: withdrawal?.reference,
    type: withdrawal?.type,
    createdAt: withdrawal?.createdAt,
    _id: withdrawal?._id,
  };
};
