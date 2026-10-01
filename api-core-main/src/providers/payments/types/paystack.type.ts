export interface IPaystackCreateLinkResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface ICreateLinkResponse {
  authorizationUrl: string;
  reference: string;
}

export interface ICreateLinkRequest {
  email: string;
  reference?: string;
  amount: number;
  metadata: string;
}

export interface IChargeAuthorizationCodeRequest {
  email: string;
  authorizationCode: string;
  reference?: string;
  amount: number;
  metadata: string;
}

export interface IVerifyTransactionResponse {
  amount: number;
  authorizationCode: string;
  status: string;
  gatewayResponse: string;
  paidAt: Date;
  metadata: string;
  bin: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: string;
  bank: string;
  reference: string;
  reusable: boolean;
}

export interface IPaystackVerifyTransactionResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: null;
    gateway_response: string;
    paid_at: Date;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: string;
    log: {
      start_time: number;
      time_spent: number;
      attempts: number;
      errors: number;
      success: true;
      mobile: false;
      input: string[];
      history: [
        {
          type: string;
          message: string;
          time: number;
        },
      ];
    };
    fees: number;
    fees_split: unknown;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: string;
      risk_action: string;
      international_format_phone: string;
    };
    plan: string;
    split: {
      [key: string]: string;
    };
    order_id: string;
    paidAt: Date;
    createdAt: Date;
    requested_amount: 20000;
    pos_transaction_data: string;
    source: string;
    fees_breakdown: string;
    transaction_date: Date;
    plan_object: {
      [key: string]: string;
    };
    subaccount: {
      [key: string]: string;
    };
  };
}

export interface ICreateTransferRecipientRequest {
  name: string;
  accountNumber: number;
  bankCode: string;
  description?: string;
}

export interface IPaystackCreateTranferRecipientResponse {
  status: boolean;
  message: string;
  data: {
    active: boolean;
    createdAt: string;
    currency: string;
    domain: string;
    id: string;
    integration: string;
    name: string;
    recipient_code: string;
    type: string;
    updatedAt: string;
    is_deleted: string;
    details: {
      authorization_code: string;
      account_number: string;
      account_name: string;
      bank_code: string;
      bank_name: string;
    };
  };
}

export interface ICreateTransferRecipientResponse {
  bankCode: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  recipientCode: string;
}

export interface IPaystackBankListResponse {
  status: boolean;
  message: string;
  data: {
    name: string;
    slug: string;
    code: string;
    longcode?: string;
    gateway?: string;
    pay_with_bank: boolean;
    active: boolean;
    is_deleted: boolean;
    country: string;
    currency: string;
    type: string;
    id: number;
    createdAt: string;
    updatedAt: string;
  }[];
}

export interface IBankListResponse {
  name: string;
  slug: string;
  code: string;
  active: boolean;
  isDeleted: boolean;
  payWithBank: boolean;
}

export interface ITransferRequest {
  reason?: string;
  reference?: string;
  amount: number;
  recipientCode: string;
}

export interface IPaystackTranferResponse {
  status: boolean;
  message: string;
  data: {
    integration: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: string;
    transfer_code: string;
    id: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ITransferResponse {
  amount: number;
  source: string;
  transferCode: string;
  status: string;
}

export interface IResolveAccountRequest {
  accountNumber: string;
  bankCode: string;
}

export interface IPaystackResolveAccountResponse {
  status: boolean;
  message: string;
  data: {
    account_number: string;
    account_name: string;
  };
}

export interface IResolveAccountResponse {
  accountNumber: string;
  accountName: string;
}
