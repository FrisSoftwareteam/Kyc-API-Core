import nodemailer from 'nodemailer';
import { IsendEmail } from './types';

export default class MailerProvider {
  private readonly config;
  private readonly logger;
  private readonly transporter: nodemailer.Transporter;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ config, logger }: any) {
    this.config = config;
    this.logger = logger;
    this.transporter = nodemailer.createTransport({
      service: 'Outlook365', // or 'Outlook365' for Office 365
      auth: {
        user: config.get('office360.username'), // Your email address
        pass: config.get('office360.password'), // Your email password
      },
    });
  }

  async send(payload: IsendEmail): Promise<string> {
    const { logger, config, transporter } = this;

    try {
      const mailOptions = {
        from: config.get('office360.username'),
        to: payload.email,
        subject: payload.subject,
        html: payload.content,
        attachments: payload.attachments,
      };

      const info = await transporter.sendMail(mailOptions);

      return `Email sent successfully: ${info.response}`;
    } catch (error) {
      logger.error(JSON.stringify(error));
      return 'Email not sent';
    }
  }
}
