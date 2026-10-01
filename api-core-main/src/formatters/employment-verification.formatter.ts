export interface IEmploymentVerificationFormatter {
  _id: string;
  status: string;
  verifiedAt: Date;
  address: string;
  identity: string;
  name: string;
  type: string;
  role: string;
  responsePayload: Map<string, string>;
  createdAt: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ employment }: any): IEmploymentVerificationFormatter => {
  return {
    _id: employment?._id,
    status: employment?.status,
    verifiedAt: employment?.verifiedAt,
    address: employment?.address,
    name: employment?.name,
    identity: employment?.identity,
    type: employment?.type,
    role: employment?.role,
    responsePayload: employment?.responsePayload,
    createdAt: employment?.createdAt,
  };
};
