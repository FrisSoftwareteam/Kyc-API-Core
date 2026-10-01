export interface ICertificateDocumentFormatter {
  _id: string;
  cost: number;
  title: string;
  status: string;
  category: string;
  imageUrl: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ certificateDocument }: any): ICertificateDocumentFormatter => {
  return {
    title: certificateDocument?.title,
    category: certificateDocument?.category,
    imageUrl: certificateDocument?.imageUrl,
    cost: certificateDocument?.cost,
    _id: certificateDocument?._id,
    status: certificateDocument?.status,
  };
};
