export interface ICriminalVerificationFormatter {
  _id: string;
  status: string;
  verifiedAt: Date;
  responsePayload: Map<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ criminal }: any): ICriminalVerificationFormatter => {
  return {
    _id: criminal?._id,
    status: criminal?.status,
    verifiedAt: criminal?.verifiedAt,
    responsePayload: criminal?.responsePayload,
  };
};
