export interface IEmailAttachments {
  filename: string;
  path?: string;
  content?: string;
}
export interface IsendEmail {
  email: string;
  subject: string;
  content: string;
  html?: string;
  from?: string;
  bcc?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attachments?: IEmailAttachments[];
}
