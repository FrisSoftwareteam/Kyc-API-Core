export interface IBankStatementFormatter {
  statements: {
    [key: string]: string;
  };
  _id: string;
  cost: number;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ bankStatement }: any): IBankStatementFormatter => {
  return {
    statements: {
      reference: bankStatement?.responseData?.uniqueReference,
      pdf: bankStatement?.responseData?.pdf,
    },
    cost: bankStatement?.cost,
    _id: bankStatement?._id,
  };
};
