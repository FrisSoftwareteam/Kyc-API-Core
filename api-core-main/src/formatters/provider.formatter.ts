export interface IProviderFormatter {
  _id: string;
  name: string;
  slug: string;
  prices: number;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ provider }: any): IProviderFormatter => {
  return {
    _id: provider?._id,
    name: provider?.name,
    slug: provider?.slug,
    prices: provider?.prices,
  };
};
