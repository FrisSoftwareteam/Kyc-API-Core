export interface IRoleFormatter {
  _id: string;
  name: string;
  permissions: string[];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ role }: any): IRoleFormatter => {
  return {
    _id: role?._id,
    name: role?.name,
    permissions: role?.permissions,
  };
};
