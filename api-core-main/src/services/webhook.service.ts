export default class WebhookService {
  private readonly TransactionService;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ TransactionService }: any) {
    this.TransactionService = TransactionService;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async paystackWebhook(payload: any) {
    const { TransactionService } = this;

    let response;

    switch (payload?.event?.toLowerCase()) {
      case 'charge.success':
        response = TransactionService.verifyTransaction({
          reference: payload?.data?.reference,
        });
        break;
      case 'transfer.success':
        response = TransactionService.successTransfer(payload?.data);
        break;
      case 'transfer.failed':
        response = TransactionService.failedTransfer(payload?.data);
        break;
      case 'transfer.reversed':
        response = TransactionService.reversedTransfer(payload?.data);
        break;
      default:
        break;
    }

    return response;
  }
}
