export interface IAcademicCertificateFormatter {
  _id: string;
  examinationBoard: string;
  examinationNumber: string;
  resultUrl?: string;
  letterOfAuthorization: string;
  letterOfRequest: string;
  category: string;
  cost: number;
  responsePayload: Map<string, unknown>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ academic }: any): IAcademicCertificateFormatter => {
  return {
    _id: academic?._id,
    examinationBoard: academic?.examinationBoard,
    examinationNumber: academic?.examNumber,
    category: academic?.category,
    letterOfAuthorization: academic?.letterOfAuthorization,
    letterOfRequest: academic?.letterOfRequest,
    resultUrl: academic?.resultUrl,
    cost: academic?.cost,
    responsePayload: academic?.responsePayload,
  };
};
