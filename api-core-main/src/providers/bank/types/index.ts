export interface IPayArenaCreateOrderIdResponse {
  success: boolean;
  description: string;
  data: {
    orderId: number;
  };
  message: string;
}

export interface CreateOrderIdResponse {
  status: boolean;
  orderId?: number | null;
}

export interface IFetchPayArenaResultResponse {
  success: boolean;
  description: string;
  data: {
    Pdf: null | string;
    UniqueReference: string;
  };
  message: 'Successful';
}

export interface IFetchResultResponse {
  status: boolean;
  uniqueReference: string;
  pdf: null | string;
}

export interface IFetchResultRequest {
  orderId: string;
  institutionCode: string;
}
