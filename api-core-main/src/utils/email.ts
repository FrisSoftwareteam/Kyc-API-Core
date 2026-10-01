import { join, resolve } from 'path';
import { readFileSync } from 'fs';
import * as ejs from 'ejs';

interface IForgotPassword {
  email: string;
  url: string;
}

interface IExportAddressPassword {
  email: string;
  name: string;
}

interface IExportVerificationData {
  email: string;
  name: string;
}

interface IVerificationApprovedContent {
  link: string;
  email: string;
  business: string;
}

interface IVerificationDeclinedContent {
  email: string;
  business: string;
}

interface IVerificationPaymentContent {
  link: string;
  email: string;
  business: string;
}

interface IExportDuplicatePassword {
  email: string;
  name: string;
}

interface IBusiness {
  name: string;
  url: string;
}

interface IPartner {
  name: string;
  url: string;
}

interface IPartnerAgentAccount {
  name: string;
}

interface IPartnerAgent {
  name: string;
  url: string;
  partner: string;
}

interface IPartnerAgentCredentials {
  name: string;
  url: string;
  partner: string;
  email: string;
  password: string;
}

interface IBusinessUser {
  firstName: string;
  lastName: string;
  url: string;
}

interface IPartnerUser {
  firstName: string;
  lastName: string;
  url: string;
}

interface IAdminContent {
  password: string;
  email: string;
}

interface IUnflaggedAddressContent {
  address: string;
  taskId: string;
}

interface IRejectAddressContent {
  address: string;
  taskId: string;
  amount: number;
}

interface INotifyPartnerTask {
  url: string;
  address: string;
  partnerName: string;
}

interface ISubmitOtherTask {
  url: string;
}

interface INotifyPartnerBulkTask {
  url: string;
  partnerName: string;
}

interface INewVerification {
  business: string;
  email: string;
  url: string;
}

export const inviteBusinessEmailContent = async (data: IBusiness): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'business-invite.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const newVerificationEmailContent = async (data: INewVerification): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'new-verification.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const invitePartnerEmailContent = async (data: IPartner): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'partner-invite.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const invitePartnerAgentEmailContent = async (data: IPartnerAgent): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'partner-invite.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const sendPartnerAgentCredentialsEmailContent = async (
  data: IPartnerAgentCredentials,
): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'partner-agent-credentials.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const createBusinessUserEmailContent = async (data: IBusinessUser): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'business-user.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const createPartnerUserEmailContent = async (data: IPartnerUser): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'partner-user.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const createPartnerAgentEmailContent = async (
  data: IPartnerAgentAccount,
): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'agent-account.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const forgotPasswordEmailContent = async (data: IForgotPassword): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'forgot-password.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const bulkAddressExportEmailContent = async (
  data: IExportAddressPassword,
): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'address-export.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const bulkVerificationExportEmailContent = async (
  data: IExportVerificationData,
): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'verification-export.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const bulkDuplicateExportEmailContent = async (
  data: IExportDuplicatePassword,
): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'duplicate-upload.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const invitAdminEmailContent = async (data: IAdminContent): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'invite-admin.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const consumerVerificationApprovedContent = async (
  data: IVerificationApprovedContent,
): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'approve-consumer-verification.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const consumerVerificationDeclinedContent = async (
  data: IVerificationDeclinedContent,
): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'decline-consumer-verification.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const consumerVerificationPaymentContent = async (
  data: IVerificationPaymentContent,
): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'payment-consumer-verification.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const unflaggedAddressEmailContent = async (
  data: IUnflaggedAddressContent,
): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'unflagged-address.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const rejectAddressEmailContent = async (data: IRejectAddressContent): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'reject-address.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const notifyPartnerAssignTask = async (data: INotifyPartnerTask): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'notify-partner-task.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const submitOtherTaskResponse = async (data: ISubmitOtherTask): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'submit-other-task.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};

export const notifyPartnerAssignBulkTask = async (
  data: INotifyPartnerBulkTask,
): Promise<string> => {
  const templateFilePathEjs = join(process.cwd(), 'src/views/emails');

  const templateFilePath = readFileSync(
    resolve(templateFilePathEjs, 'notify-partner-bulk-task.email.html'),
    'utf8',
  );

  const content = await ejs.render(templateFilePath, { ...data });

  return content;
};
