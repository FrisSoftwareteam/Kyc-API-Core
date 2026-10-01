import {
  CreateFundWalletPaymentLinkInput,
  VerifyPaymentInput,
  ResolveAccountNumberInput,
} from '../schemas/transaction.schema';
import { paginationReqData, paginationMetaData } from '../utils/helper';
import { BadRequestError } from '../errors/api.error';
import { generateUniqueReference } from '../utils/helper';
import { PaymentTypeEnum, PaymentStatusEnum } from '../models/types/transaction.type';
import { PaymentStatusEnum as AgentPaymentStatusEnum } from '../models/types/agent-transaction.type';
import { consumerVerificationPaymentContent } from '../utils/email';

export default class TransactionService {
  private readonly config;
  private readonly logger;
  private readonly CardDataAccess;
  private readonly TaskDataAccess;
  private readonly AgentDataAccess;
  private readonly PaystackProvider;
  private readonly BusinessDataAccess;
  private readonly NotificationProvider;
  private readonly TransactionDataAccess;
  private readonly AgentTransactionDataAccess;

  constructor({
    config,
    logger,
    CardDataAccess,
    TaskDataAccess,
    AgentDataAccess,
    PaystackProvider,
    BusinessDataAccess,
    NotificationProvider,
    TransactionDataAccess,
    AgentTransactionDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.logger = logger;
    this.CardDataAccess = CardDataAccess;
    this.TaskDataAccess = TaskDataAccess;
    this.AgentDataAccess = AgentDataAccess;
    this.PaystackProvider = PaystackProvider;
    this.BusinessDataAccess = BusinessDataAccess;
    this.NotificationProvider = NotificationProvider;
    this.TransactionDataAccess = TransactionDataAccess;
    this.AgentTransactionDataAccess = AgentTransactionDataAccess;
  }

  async createFundWalletPaymentLink(
    payload: CreateFundWalletPaymentLinkInput,
  ): Promise<{ link: string; reference: string }> {
    const { PaystackProvider, BusinessDataAccess, TransactionDataAccess } = this;

    const { businessId, amount } = payload;

    const business = await BusinessDataAccess.findBusinessById(businessId);

    if (!business) {
      throw new BadRequestError('Invalid Business ID', { code: 'BUSINESS_NOT_FOUND' });
    }

    const reference = generateUniqueReference('fund');

    const [, response] = await Promise.all([
      TransactionDataAccess.create({
        type: PaymentTypeEnum.CREDIT,
        amount: payload.amount,
        business: payload.businessId,
        user: payload.userId,
        reference,
      }),
      PaystackProvider.createTransactionLink({
        amount,
        email: business.email,
        reference,
        metadata: JSON.stringify({
          businessId: business?._id,
          type: PaymentTypeEnum.CREDIT,
        }),
        ...(payload.allowedChannel ? { channels: [payload.allowedChannel] } : undefined),
      }),
    ]);

    return {
      link: response?.authorizationUrl,
      reference: response?.reference,
    };
  }

  async verifyTransaction(
    payload: VerifyPaymentInput,
    authorizationChargePayload?: {
      authorizationCodeCharge: boolean;
      businessId: string;
      type: string;
    },
  ) {
    const { PaystackProvider, logger } = this;

    try {
      const response = await PaystackProvider.verifyTransaction(payload.reference);

      const pass = await this.saveTransaction(response, authorizationChargePayload);

      if (!pass) {
        return {
          status: false,
          message: 'Transaction not successful',
        };
      }

      if (response?.reusable) {
        await this.upsertCard(response);
      }

      return {
        status: true,
        message: 'Transaction Successfully Updated',
      };
    } catch (err) {
      logger.error(JSON.stringify({ err }));
      return {
        status: true,
        message: 'Transaction Successfully Updated',
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async upsertCard(response: any) {
    const { CardDataAccess } = this;

    CardDataAccess.upsertCardData(
      {
        business: response.metadata?.businessId,
        authorizationCode: response?.authorizationCode,
      },
      {
        business: response.metadata?.businessId,
        authorizationCode: response?.authorizationCode,
        bin: response?.bin,
        lastFourDigit: response?.last4,
        expiryMonth: response?.expiryMonth,
        expiryYear: response?.expiryYear,
        cardType: response?.cardType,
        reusable: response?.reusable,
      },
    );

    return true;
  }

  async saveTransaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: any,
    authorizationChargePayload?: {
      authorizationCodeCharge: boolean;
      businessId: string;
      type: string;
    },
  ) {
    const {
      TaskDataAccess,
      BusinessDataAccess,
      TransactionDataAccess,
      NotificationProvider,
      logger,
    } = this;

    const transactionData = await TransactionDataAccess.findTransactionByReference(
      response.reference,
    );

    if (!transactionData) {
      logger.error('Transaction reference not found');
      return false;
    }

    if (transactionData.status === PaymentStatusEnum.SUCCESSFUL) {
      logger.error('Transaction approved before');
      return false;
    }

    const isSuccessTransaction = ['successful', 'success', 'approved'].includes(
      response.status.toLowerCase(),
    );

    TransactionDataAccess.updateOneTransaction(
      {
        reference: response.reference,
        status: {
          $ne: PaymentStatusEnum.SUCCESSFUL,
        },
      },
      {
        status: isSuccessTransaction ? PaymentStatusEnum.SUCCESSFUL : PaymentStatusEnum.FAILED,
        paidAt: response?.paidAt,
      },
    );

    if (!isSuccessTransaction) {
      logger.error(`Response Received for ${response.response} is not successful`);
      return false;
    }

    const transactionType = authorizationChargePayload?.authorizationCodeCharge
      ? authorizationChargePayload.type
      : response?.metadata?.type;
    if (transactionType === PaymentTypeEnum.CREDIT) {
      const businesId = authorizationChargePayload?.authorizationCodeCharge
        ? authorizationChargePayload.businessId
        : response?.metadata?.businessId;

      const business = await BusinessDataAccess.findBusinessById(businesId);

      if (!business) {
        return false;
      }

      await this.updateBusinessWalletBalance(response, business);
    }

    if (transactionType === 'consumer') {
      await TaskDataAccess.updateTaskById(response?.metadata?.verificationId, {
        paid: true,
      });

      const emailContent = await consumerVerificationPaymentContent({
        email: response?.metadata?.email,
        link: response?.authorizationUrl,
        business: response?.metadata?.business,
      });

      await NotificationProvider.email.send({
        email: response?.metadata?.email,
        subject: 'Your payment has been received',
        content: emailContent,
      });
    }

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateBusinessWalletBalance(response: any, business: any) {
    const { BusinessDataAccess } = this;

    const walletBalance: number = business?.wallet?.balance || 0;
    const walletBookBalance: number = business?.wallet?.bookBalance || 0;
    const walletOutstandingBalance: number = business?.wallet?.outstandingBalance || 0;
    const totalWalletAmount: number = walletBalance + response.amount;
    const totalBookWalletAmount: number = walletBookBalance + response.amount;

    const outstandingBalance = totalWalletAmount + (walletOutstandingBalance || 0);
    const outstandingBookBalance = totalBookWalletAmount + (walletOutstandingBalance || 0);
    const outstandingBalanceCondition = outstandingBalance > 0 || 0 === 0;
    const newWalletBalance = outstandingBalance === 0 ? 0 : Number(outstandingBalance);
    const newOutstandingWalletBalance =
      outstandingBalance === 0 ? 0 : Number(outstandingBookBalance);

    await BusinessDataAccess.updateBusinessById(business?._id, {
      wallet: {
        outstandingBalance: outstandingBalanceCondition
          ? 0
          : Number((walletOutstandingBalance || 0) + response.amount),
        balance: outstandingBalanceCondition ? newWalletBalance : walletBalance || 0,
        bookBalance: outstandingBalanceCondition
          ? newOutstandingWalletBalance
          : walletBookBalance || 0,
      },
    });

    return true;
  }

  async businessTransactions(businessId: string, query: Record<string, unknown>) {
    const { TransactionDataAccess } = this;

    const {
      page = 1,
      size = 20,
      status,
      period,
      type,
      search,
      customStartDate,
      customEndDate,
    } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);

    const [transactions] = await TransactionDataAccess.allBusinessTransactions(
      businessId,
      { status, period, type, search, customStartDate, customEndDate },
      { offset, limit },
    );

    const meta = paginationMetaData(
      transactions?.metadata[0]?.total,
      pageNum,
      offset,
      size as number,
    );

    return {
      meta,
      transactions,
    };
  }

  async chargeBusinessCard(
    businessId: string,
    email: string,
    userId: string,
    authorizationCode: string,
    amount: number,
  ) {
    const { PaystackProvider, TransactionDataAccess } = this;

    const reference = generateUniqueReference('charge');

    await Promise.all([
      TransactionDataAccess.create({
        type: PaymentTypeEnum.CREDIT,
        amount: amount,
        business: businessId,
        user: userId,
        reference,
      }),
      PaystackProvider.chargeCardAuthorizationCode({
        email,
        authorizationCode,
        reference,
        amount,
        metadata: JSON.stringify({
          businessId: businessId,
          type: PaymentTypeEnum.CREDIT,
        }),
      }),
    ]);

    const verifyTransactionData = await this.verifyTransaction(
      { reference },
      {
        authorizationCodeCharge: true,
        businessId: businessId,
        type: PaymentTypeEnum.CREDIT,
      },
    );

    if (!verifyTransactionData.status) {
      return false;
    }

    return true;
  }

  async calculateTotalVerificationCost(businessId: string) {
    const { TransactionDataAccess } = this;

    const [totalVerification] =
      await TransactionDataAccess.calculateTotalVerificationCost(businessId);

    return totalVerification?.cost || 0;
  }

  async resolveAccountNumber(payload: ResolveAccountNumberInput) {
    const { PaystackProvider } = this;

    const accountDetails = await PaystackProvider.resolveAccountNumber(payload);

    return accountDetails;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async successTransfer(payload: any) {
    const { AgentTransactionDataAccess, AgentDataAccess, logger } = this;

    const agentTransaction = await AgentTransactionDataAccess.updateOneTransaction(
      {
        reference: payload?.reference,
        transferCode: payload?.transfer_code,
      },
      {
        status: AgentPaymentStatusEnum.SUCCESSFUL,
        sessionId: payload?.session?.id,
      },
    );

    if (!agentTransaction) {
      logger.info('Action Failed, transaction update not found');
      return 'Action Failed, transaction update not found';
    }

    const amount = Number(payload?.amount / 100);

    const agent = await AgentDataAccess.findAgentById(agentTransaction.agent);

    if (!agent) {
      logger.info('Invalid Agent ID');
      return 'Failed to Update Wallet';
    }

    await AgentDataAccess.updateAgentById(agentTransaction.agent, {
      wallet: {
        ...agent?.wallet,
        totalPaid: Number((agent?.wallet?.totalPaid || 0) + amount),
        outstandingPayment: Number((agent?.wallet?.outstandingPayment || 0) - amount),
      },
    });

    return 'Recieved Successfully';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async failedTransfer(payload: any) {
    const { AgentTransactionDataAccess } = this;

    await AgentTransactionDataAccess.updateOneTransaction(
      {
        reference: payload?.reference,
        transferCode: payload?.transfer_code,
      },
      {
        status: AgentPaymentStatusEnum.FAILED,
      },
    );

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async reversedTransfer(payload: any) {
    const { AgentTransactionDataAccess, AgentDataAccess, logger } = this;

    const agentTransaction = await AgentTransactionDataAccess.updateOneTransaction(
      {
        reference: payload?.reference,
        transferCode: payload?.transfer_code,
      },
      {
        status: AgentPaymentStatusEnum.REVERSED,
      },
    );

    if (!agentTransaction) {
      logger.info('Action Failed, transaction update not found');
      return 'Action Failed, transaction update not found';
    }

    const amount = Number(payload?.amount / 100);

    const agent = await AgentDataAccess.findAgentById(agentTransaction.agent);

    if (!agent) {
      logger.info('Invalid Agent ID');
      return 'Failed to Update Wallet';
    }

    await AgentDataAccess.updateAgentById(agentTransaction.agent, {
      wallet: {
        ...agent?.wallet,
        withdrawableAmount: Number((agent?.wallet?.withdrawableAmount || 0) + amount),
      },
    });

    return 'Reversed Successfully';
  }
}
