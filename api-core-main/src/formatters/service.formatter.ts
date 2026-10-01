export interface IServiceFormatter {
  _id: string;
  name: string;
  slug: string;
  price: number;
  active: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ service }: any): IServiceFormatter => {
  return {
    _id: service?._id,
    name: service?.name,
    slug: service?.slug,
    price: service?.price,
    active: service?.active,
  };
};
