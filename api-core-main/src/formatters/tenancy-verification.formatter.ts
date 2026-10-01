export interface ITenancyVerificationFormatter {
  _id: string;
  status: string;
  verifiedAt: Date;
  identity: Record<string, unknown>;
  address: Record<string, unknown>;
  guarantor: Record<string, unknown>;
  employment: Record<string, unknown>;
  businessPartnership: Record<string, unknown>;
  agency: Record<string, unknown>;
  ownership: Record<string, unknown>;
  responsePayload: Map<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ tenancy }: any): ITenancyVerificationFormatter => {
  return {
    _id: tenancy?._id,
    status: tenancy?.status,
    verifiedAt: tenancy?.verifiedAt,
    identity: tenancy?.identityVerification,
    address: tenancy?.addressVerification,
    guarantor: tenancy?.guarantorVerification,
    employment: tenancy?.employmentVerification,
    businessPartnership: tenancy?.businessVerification,
    agency: tenancy?.agency,
    ownership: tenancy?.ownership,
    responsePayload: tenancy?.responsePayload,
  };
};
