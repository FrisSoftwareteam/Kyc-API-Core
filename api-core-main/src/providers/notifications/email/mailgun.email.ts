import FormData from 'form-data';
import Mailgun, { MailgunClientOptions, Interfaces } from 'mailgun.js';
const mailgun = new Mailgun(FormData);

interface IsendEmail {
  email: string;
  subject: string;
  content: string;
  html?: string;
  from?: string;
  bcc?: string[];
}

export default class MailgunProvider {
  private readonly config;
  private readonly logger;
  private readonly MailgunClient: Interfaces.IMailgunClient;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ config, logger }: Record<string, any>) {
    this.config = config;
    const mailgunClientOptions: MailgunClientOptions = {
      username: 'api',
      key: this.config.get('mailgun.apiKey'),
    };
    const mailgunClient: Interfaces.IMailgunClient = mailgun.client(mailgunClientOptions);

    this.MailgunClient = mailgunClient;
    this.logger = logger;
  }

  async send(payload: IsendEmail): Promise<string> {
    const { logger } = this;
    try {
      const { MailgunClient, config } = this;
      const { subject, content, email, from = config.get('mailgun.from') } = payload;

      await MailgunClient.messages.create(config.get('mailgun.domain'), {
        from,
        to: email,
        subject,
        html: content,
      });

      return 'Email sent successfully';
    } catch (error) {
      logger.error(JSON.stringify(error));
      return 'Email not sent';
    }
  }

  async sendWithAttachment(payload: IsendEmail): Promise<string> {
    const { logger } = this;
    const { MailgunClient, config } = this;
    const { subject, content, email, from = config.get('mailgun.from') } = payload;
    try {
      await MailgunClient.messages.create(config.get('mailgun.domain'), {
        from,
        to: email,
        subject,
        html: content,
      });

      return 'Email sent successfully';
    } catch (error) {
      logger.error(JSON.stringify(error));
      return 'Email not sent';
    }
  }
}
