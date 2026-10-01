export enum StatusEnum {
  ACTIVE = 'active',
  DISABLED = 'disable',
}

export interface ICategory {
  name: string;
  slug: string;
  status: StatusEnum;
}
