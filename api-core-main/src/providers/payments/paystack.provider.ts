import axios from 'axios';
import {
  IPaystackCreateLinkResponse,
  ICreateLinkResponse,
  ICreateLinkRequest,
  IPaystackVerifyTransactionResponse,
  IVerifyTransactionResponse,
  IChargeAuthorizationCodeRequest,
  ICreateTransferRecipientRequest,
  IPaystackCreateTranferRecipientResponse,
  ICreateTransferRecipientResponse,
  IBankListResponse,
  IPaystackBankListResponse,
  ITransferRequest,
  IPaystackTranferResponse,
  ITransferResponse,
  IPaystackResolveAccountResponse,
  IResolveAccountResponse,
  IResolveAccountRequest,
} from './types/paystack.type';
import { BadRequestError } from '../../errors/api.error';

export interface IReverseGeocodePointRequest {
  longitude: number;
  latitude: number;
}

export default class PaystackProvider {
  private readonly url: string;
  private readonly secretKey: string;
  private readonly logger;
  private readonly config;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ config, logger }: any) {
    const url = config.get('paystack.url');
    const secretKey = config.get('paystack.secretKey');

    this.secretKey = secretKey;
    this.logger = logger;
    this.url = url;
    this.config = config;
  }

  async createTransactionLink(payload: ICreateLinkRequest): Promise<ICreateLinkResponse> {
    const { url, secretKey, logger, config } = this;

    const start = new Date();

    const request = {
      method: 'POST',
      url: `${url}/transaction/initialize`,
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      data: {
        ...payload,
        amount: payload.amount * 100,
        callback_url: `${config.get('frontend.businessUrl')}/transactions`,
      },
      validateStatus: () => true,
    };

    const { data } = await axios<IPaystackCreateLinkResponse>(request);

    const elapsed = +new Date() - +start;

    logger.debug('paystack response', {
      url,
      data: payload,
      start,
      elapsed,
      status: data.status,
    });

    if (data.status === false) {
      logger.error(JSON.stringify(data));
      throw new BadRequestError('Something went wrong', {
        code: 'PAYSTACK_LINK_FAILED',
      });
    }

    return {
      authorizationUrl: data?.data?.authorization_url,
      reference: data?.data?.reference,
    };
  }

  async chargeCardAuthorizationCode(
    payload: IChargeAuthorizationCodeRequest,
  ): Promise<ICreateLinkResponse> {
    const { url, secretKey, logger } = this;

    const start = new Date();

    const request = {
      method: 'POST',
      url: `${url}/transaction/charge_authorization`,
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      data: {
        email: payload.email,
        amount: payload.amount * 100,
        authorization_code: payload.authorizationCode,
        reference: payload.reference,
      },
      validateStatus: () => true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<IPaystackCreateLinkResponse>(request);

    const elapsed = +new Date() - +start;

    logger.debug('paystack response', {
      url,
      data: payload,
      start,
      elapsed,
      status: data.status,
    });

    if (data.status === false) {
      logger.error(JSON.stringify(data));
      throw new BadRequestError('Something went wrong', {
        code: 'PAYSTACK_AUTHORIZATION_ATTEMPT_FAILED',
      });
    }

    return {
      authorizationUrl: data?.data?.authorization_url,
      reference: data?.data?.reference,
    };
  }

  async verifyTransaction(reference: string): Promise<IVerifyTransactionResponse> {
    const { url, secretKey, logger } = this;

    const start = new Date();

    const request = {
      method: 'GET',
      url: `${url}/transaction/verify/${reference}`,
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      validateStatus: () => true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<IPaystackVerifyTransactionResponse>(request);

    const elapsed = +new Date() - +start;

    logger.debug('paystack response', {
      url,
      start,
      elapsed,
      status: data.status,
    });

    if (data.status === false) {
      logger.error(JSON.stringify(data));
      throw new BadRequestError('Something went wrong', {
        code: 'PAYSTACK_VERIFY_TRANSACTION_FAILED',
      });
    }

    return {
      authorizationCode: data?.data?.authorization?.authorization_code,
      status: data?.data?.status,
      amount: Number(data?.data?.amount / 100),
      reference: data?.data?.reference,
      gatewayResponse: data?.data?.gateway_response,
      paidAt: data?.data?.paid_at,
      metadata: data?.data?.metadata,
      bin: data?.data?.authorization?.bin,
      last4: data?.data?.authorization?.last4,
      expiryMonth: data?.data?.authorization?.exp_month,
      expiryYear: data?.data?.authorization?.exp_year,
      cardType: data?.data?.authorization?.card_type,
      bank: data?.data?.authorization?.bank,
      reusable: data?.data?.authorization?.reusable,
    };
  }

  async createTransferRecipient(
    payload: ICreateTransferRecipientRequest,
  ): Promise<ICreateTransferRecipientResponse> {
    const { url, secretKey, logger } = this;

    const start = new Date();

    const request = {
      method: 'POST',
      url: `${url}/transferrecipient`,
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      data: {
        account_number: payload.accountNumber,
        bank_code: payload.bankCode,
        type: 'nuban',
      },
      validateStatus: () => true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<IPaystackCreateTranferRecipientResponse>(request);

    const elapsed = +new Date() - +start;

    logger.debug('paystack response', {
      url,
      start,
      elapsed,
      status: data.status,
    });

    if (data.status === false) {
      logger.error(JSON.stringify(data));
      throw new BadRequestError('Something went wrong', {
        code: 'PAYSTACK_CREATE_RECIPIENT_FAILED',
      });
    }

    return {
      bankCode: data?.data?.details?.bank_code,
      bankName: data?.data?.details?.bank_name,
      accountName: data?.data?.details?.account_name,
      accountNumber: data?.data?.details?.account_number,
      recipientCode: data?.data?.recipient_code,
    };
  }

  async bankList(): Promise<IBankListResponse[]> {
    const { url, secretKey, logger } = this;

    const start = new Date();

    const request = {
      method: 'GET',
      url: `${url}/bank`,
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      params: {
        country: 'nigeria',
        use_cursor: false,
      },
      validateStatus: () => true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<IPaystackBankListResponse>(request);

    const elapsed = +new Date() - +start;

    logger.debug('paystack response', {
      url,
      start,
      elapsed,
      status: data.status,
    });

    if (data.status === false) {
      logger.error(JSON.stringify(data));
      throw new BadRequestError('Something went wrong', {
        code: 'PAYSTACK_CREATE_RECIPIENT_FAILED',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data?.data?.map((data: any) => ({
      name: data?.name,
      slug: data?.slug,
      code: data?.code,
      active: data?.active,
      isDeleted: data?.is_deleted,
      payWithBank: data?.pay_with_bank,
    }));
  }

  async transfer(payload: ITransferRequest): Promise<ITransferResponse> {
    const { url, secretKey, logger } = this;

    const start = new Date();

    const request = {
      method: 'POST',
      url: `${url}/transfer`,
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      data: {
        source: 'balance',
        ...(payload.reason ? { reason: payload.reason } : undefined),
        ...(payload.reference ? { reference: payload.reference } : undefined),
        amount: payload.amount,
        recipient: payload.recipientCode,
      },
      validateStatus: () => true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<IPaystackTranferResponse>(request);

    const elapsed = +new Date() - +start;

    logger.debug('paystack response', {
      url,
      start,
      elapsed,
      status: data.status,
    });

    if (data.status === false) {
      logger.error(JSON.stringify(data));
      throw new BadRequestError('Something went wrong', {
        code: 'PAYSTACK_TRANSFER_FAILED',
      });
    }

    return {
      amount: data?.data?.amount,
      source: data?.data?.source,
      transferCode: data?.data?.transfer_code,
      status: data?.data?.status,
    };
  }

  async resolveAccountNumber(payload: IResolveAccountRequest): Promise<IResolveAccountResponse> {
    const { url, secretKey, logger } = this;

    const start = new Date();

    const request = {
      method: 'GET',
      url: `${url}/bank/resolve`,
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      params: {
        account_number: payload.accountNumber,
        bank_code: payload.bankCode,
      },
      validateStatus: () => true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axios<IPaystackResolveAccountResponse>(request);

    const elapsed = +new Date() - +start;

    logger.debug('paystack response', {
      url,
      start,
      elapsed,
      status: data.status,
    });

    if (data.status === false) {
      logger.error(JSON.stringify(data));
      throw new BadRequestError('Something went wrong', {
        code: 'PAYSTACK_RESOLVE_ACCOUNT_FAILED',
      });
    }

    return {
      accountName: data?.data?.account_name,
      accountNumber: data?.data?.account_number,
    };
  }
}
