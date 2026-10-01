export interface IHouseholdVerificationFormatter {
  _id: string;
  status: string;
  verifiedAt: Date;
  identity: Record<string, unknown>;
  address: Record<string, unknown>;
  guarantor: Record<string, unknown>;
  employment: Record<string, unknown>;
  ancestry: Record<string, unknown>;
  responsePayload: Map<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ household }: any): IHouseholdVerificationFormatter => {
  return {
    _id: household?._id,
    status: household?.status,
    verifiedAt: household?.verifiedAt,
    identity: household?.identityVerification,
    address: household?.addressVerification,
    guarantor: household?.guarantorVerification,
    employment: household?.employmentVerification,
    ancestry: household?.ancestry,
    responsePayload: household?.responsePayload,
  };
};
