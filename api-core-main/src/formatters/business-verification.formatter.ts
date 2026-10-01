export interface IBusinessVerificationFormatter {
  _id: string;
  status: string;
  verifiedAt: Date;
  name: string;
  address: string;
  responsePayload: Map<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ business }: any): IBusinessVerificationFormatter => {
  return {
    _id: business?._id,
    status: business?.status,
    verifiedAt: business?.verifiedAt,
    name: business?.businessName,
    address: business?.address,
    responsePayload: business?.responsePayload,
  };
};
