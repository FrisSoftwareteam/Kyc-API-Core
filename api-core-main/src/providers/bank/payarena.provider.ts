import axios from 'axios';

import {
  CreateOrderIdResponse,
  IPayArenaCreateOrderIdResponse,
  IFetchResultRequest,
  IFetchResultResponse,
  IFetchPayArenaResultResponse,
} from './types';

export default class Payarena {
  private readonly config;
  private readonly logger;
  private readonly Url: string;
  private readonly MerchantId: string;
  private readonly SecretKey: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ config, logger }: any) {
    this.config = config;
    this.logger = logger;
    this.Url = config.get('payarena.url');
    this.SecretKey = config.get('payarena.secretKey');
    this.MerchantId = config.get('payarena.merchantId');
  }

  async createOrderId(): Promise<CreateOrderIdResponse> {
    const { SecretKey, MerchantId, Url, config } = this;

    const request = {
      method: 'POST',
      url: `${Url}/api/thirdparty/index/13579`,
      data: {
        ServiceCode: MerchantId,
        ReturnUrl: `${config.get('frontend.businessUrl')}/verifications`,
        SecretKey,
      },
      validateStatus: () => true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<IPayArenaCreateOrderIdResponse>(request);

    if (!data.success) {
      return {
        status: false,
        orderId: null,
      };
    }

    return {
      status: true,
      orderId: data?.data?.orderId,
    };
  }

  async fetchResult(payload: IFetchResultRequest): Promise<IFetchResultResponse> {
    const { Url } = this;

    const request = {
      method: 'GET',
      url: `${Url}/api/thirdparty/getresult/${payload.orderId}?institutionCode=${payload.institutionCode}`,
      validateStatus: () => true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<IFetchPayArenaResultResponse>(request);

    if (!data.success) {
      return {
        status: false,
        uniqueReference: data?.data?.UniqueReference,
        pdf: data?.data?.Pdf,
      };
    }

    return {
      status: true,
      uniqueReference: data?.data?.UniqueReference,
      pdf: data?.data?.Pdf,
    };
  }
}
