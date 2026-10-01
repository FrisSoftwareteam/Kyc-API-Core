export interface IGuarantorVerificationFormatter {
  _id: string;
  status: string;
  verifiedAt: Date;
  name: string;
  nin: string;
  address: string;
  addressType: string;
  certificateUrl: string;
  type: string;
  attestationUrl: string;
  questionaireUrl: string;
  phoneNumber: string;
  email: string;
  responsePayload: Map<string, string>;
  createdAt: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ guarantor }: any): IGuarantorVerificationFormatter => {
  return {
    _id: guarantor?._id,
    status: guarantor?.status,
    verifiedAt: guarantor?.verifiedAt,
    address: guarantor?.address,
    addressType: guarantor?.addressType,
    name: guarantor?.name,
    nin: guarantor?.nin,
    certificateUrl: guarantor?.certificateUrl,
    type: guarantor?.type,
    phoneNumber: guarantor?.phoneNumber,
    email: guarantor?.email,
    questionaireUrl: guarantor?.questionaireUrl,
    attestationUrl: guarantor?.attestationUrl,
    responsePayload: guarantor?.responsePayload,
    createdAt: guarantor.createdAt,
  };
};
