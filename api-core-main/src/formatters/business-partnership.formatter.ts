export interface IBusinessPartnershipFormatter {
  _id: string;
  status: string;
  verifiedAt: Date;
  businessName: string;
  directorNins: string[];
  address: string;
  certificateUrl: string;
  type: string;
  guarantor: Record<string, unknown>;
  responsePayload: Map<string, string>;
  createdAt: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ partnership }: any): IBusinessPartnershipFormatter => {
  return {
    _id: partnership?._id,
    status: partnership?.status,
    verifiedAt: partnership?.verifiedAt,
    businessName: partnership?.businessName,
    address: partnership?.address,
    directorNins: partnership?.directorNins,
    certificateUrl: partnership?.certificateUrl,
    type: partnership?.type,
    guarantor: partnership?.guarantor,
    responsePayload: partnership?.responsePayload,
    createdAt: partnership.createdAt,
  };
};
