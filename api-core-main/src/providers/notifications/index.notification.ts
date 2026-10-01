import MailgunProvider from './email/mailgun.email';
// import SendgridProvider from './email/sendgrid.email';
import MailerProvider from './email/nodemailer.email';

export default class NotificationProvider {
  private readonly emailProvider;
  private readonly emailProvider2;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ config, logger }: any) {
    this.emailProvider2 = new MailgunProvider({ config, logger });
    // this.emailProvider3 = new SendgridProvider({ config, logger });
    this.emailProvider = new MailerProvider({ config, logger });
  }

  get email() {
    return this.emailProvider;
  }
}
