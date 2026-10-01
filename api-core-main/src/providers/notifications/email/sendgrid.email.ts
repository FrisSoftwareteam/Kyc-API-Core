import SgMail from '@sendgrid/mail';

// const mailgun = new Mailgun(FormData);

interface IsendEmail {
  email: string;
  subject: string;
  content: string;
  html?: string;
  from?: string;
  bcc?: string[];
}

export default class SendgridProvider {
  private readonly config;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly SendgridClient: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ config }: Record<string, any>) {
    this.config = config;

    SgMail.setApiKey(config.get('sendgrid.apiKey'));

    this.SendgridClient = SgMail;
  }

  async send(payload: IsendEmail): Promise<string> {
    const { SendgridClient, config } = this;
    const { subject, content, email, from = config.get('sendgrid.from') } = payload;

    await SendgridClient.send({
      from,
      subject,
      html: `${content}`,
      to: email,
    });

    return 'Email sent Sendgrid successfully';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendEmailWithAttachment(payload: IsendEmail) {
    // const { MailgunClient, config } = this;
    // const { subject, content, email, from = config.get('mailgun.from') } = payload;
    // await MailgunClient.messages.create(config.get('mailgun.domain'), {
    //   from,
    //   to: email,
    //   subject,
    //   html: content,
    // });
    // return 'Email sent successfully';
  }
}
