export interface IDocumentFormatter {
  _id: string;
  documentUrls: string[];
  nameOfDocument: string;
  category: string;
  cost: number;
  responsePayload: Map<string, unknown>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ document }: any): IDocumentFormatter => {
  return {
    _id: document?._id,
    documentUrls: document?.documentUrls,
    nameOfDocument: document?.nameOfDocument,
    category: document?.category,
    cost: document?.cost,
    responsePayload: document?.responsePayload,
  };
};
