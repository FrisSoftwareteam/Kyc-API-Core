export interface ICategoryFormatter {
  _id: string;
  name: string;
  slug: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ category }: any): ICategoryFormatter => {
  return {
    _id: category?._id,
    name: category?.name,
    slug: category?.slug,
  };
};
