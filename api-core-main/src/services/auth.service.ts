import {
  UserLoginInput,
  ForgotPasswordInput,
  RefreshAccessTokenInput,
} from '../schemas/auth.schema';
import { signJwt } from '../core/JWT';
import {
  BadRequestError,
  NotFoundError,
  AuthFailureError,
  ForbiddenError,
} from '../errors/api.error';
import { UserType } from '../constants';
import { forgotPasswordEmailContent } from '../utils/email';
import { getVerificationCodeAndExpiry } from '../utils/helper';
import { AgentStatus, AgentOnlineStatus } from '../models/types/agent.type';
import { AdminStatusEnum } from '../models/types/admin.type';

export default class AuthService {
  private readonly config;
  private readonly UserDataAccess;
  private readonly AdminDataAccess;
  private readonly BusinessDataAccess;
  private readonly PartnerDataAccess;
  private readonly NotificationProvider;
  private readonly AgentDataAccess;

  constructor({
    config,
    UserDataAccess,
    AdminDataAccess,
    BusinessDataAccess,
    NotificationProvider,
    PartnerDataAccess,
    AgentDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.UserDataAccess = UserDataAccess;
    this.AdminDataAccess = AdminDataAccess;
    this.BusinessDataAccess = BusinessDataAccess;
    this.PartnerDataAccess = PartnerDataAccess;
    this.NotificationProvider = NotificationProvider;
    this.AgentDataAccess = AgentDataAccess;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async signJwtToken(user: any) {
    const { config } = this;

    const accessToken = signJwt(
      {
        iss: config.get('appName'),
        sub: user._id,
        aud: user?.userType,
        agentId: user?.agentId,
        adminId: user?.adminId,
        userType: user?.userType,
        partnerId: user?.partnerId,
        businessId: user?.businessId,
        countryCode: user?.country?.code,
        firstTimeLogin: user?.firstTimeLogin,
      },
      `${config.get('jwt.accessTokenPrivateKey')}`,
      {
        expiresIn: `${config.get('jwt.accessTokenExpiryMins')}m`,
      },
    );

    const refreshToken = signJwt(
      {
        sub: user._id,
      },
      `${config.get('jwt.refreshTokenPrivateKey')}`,
      {
        expiresIn: `${config.get('jwt.refreshTokenExpiryMins')}m`,
      },
    );

    return { accessToken, refreshToken };
  }

  async loginUser(payload: UserLoginInput, inputUserType?: string) {
    const {
      UserDataAccess,
      BusinessDataAccess,
      PartnerDataAccess,
      AgentDataAccess,
      AdminDataAccess,
    } = this;
    const { email, password } = payload;

    const user = await UserDataAccess.findUserAuthByEmail(email);

    if (!user) {
      throw new AuthFailureError('Invalid email or password.', {
        code: 'INVALID_LOGIN_CREDENTIALS',
      });
    }

    if (!(await user.comparePasswords(password, user.password))) {
      throw new AuthFailureError('Invalid email or password.', {
        code: 'INVALID_LOGIN_CREDENTIALS',
      });
    }

    if (user.userType !== inputUserType) {
      throw new AuthFailureError('You are not authorized to login to this dashboard.', {
        code: 'LOGIN_CREDENTIALS_FAILED',
      });
    }

    let businessId;
    let partnerId;
    let agentId;
    let adminId;

    if (user.userType === UserType.BUSINESS) {
      const business = await BusinessDataAccess.findUserBusinessByUserId(user._id);

      if (!business) {
        throw new BadRequestError('Invalid Business User', { code: 'INVALID_BUSINESS_USER' });
      }

      if (!business.active) {
        throw new ForbiddenError('Account has been suspended, please reach out to administrator', {
          code: 'BUSINESS_ACCOUNT_SUSPENDED',
        });
      }

      businessId = business._id;
    }

    if (user.userType === UserType.PARTNER) {
      const partner = await PartnerDataAccess.findUserPartnerByUserId(user._id);

      if (!partner) {
        throw new BadRequestError('Invalid Partner User', { code: 'INVALID_PARTNER_USER' });
      }

      if (!partner.active) {
        throw new ForbiddenError('Account has been suspended, please reach out to administrator', {
          code: 'PARTNER_ACCOUNT_SUSPENDED',
        });
      }

      partnerId = partner._id;
    }

    if (user.userType === UserType.ADMINISTRATOR) {
      const admin = await AdminDataAccess.findAdminByUserId(user._id);

      if (!admin) {
        throw new BadRequestError('Invalid Admin Account', { code: 'INVALID_ADMIN_ACCOUNT' });
      }

      if (admin.status !== AdminStatusEnum.ACTIVE) {
        throw new ForbiddenError('Account has been suspended', { code: 'INVALID_ADMIN_ACCOUNT' });
      }

      adminId = admin._id;
    }

    if (user.userType === UserType.AGENT) {
      const agent = await AgentDataAccess.findByUserId(user._id);

      if (!agent) {
        throw new BadRequestError('Invalid Agent', { code: 'INVALID_AGENT' });
      }

      if ([AgentStatus.INACTIVE, AgentStatus.SUSPENDED].includes(agent?.status)) {
        throw new BadRequestError('Account is not active', { code: 'INACTIVE_ACCOUNT' });
      }

      await AgentDataAccess.updateAgentById(agent._id, { onlineStatus: AgentOnlineStatus.ONLINE });

      agentId = agent._id;
      partnerId = agent.partner;
    }

    const { accessToken, refreshToken } = await this.signJwtToken({
      agentId,
      adminId,
      partnerId,
      businessId,
      ...user._doc,
    });

    if (user?.firstTimeLogin) {
      await UserDataAccess.updateUserById(user?._id, { firstTimeLogin: false });
    }

    return {
      user: {
        id: user._id,
        firstTimeLogin: user?.firstTimeLogin,
        ...(businessId ? { businessId } : undefined),
        ...(partnerId ? { partnerId } : undefined),
        ...(agentId ? { agentId } : undefined),
        ...(adminId ? { adminId } : undefined),
      },
      jwt: {
        accessToken,
        refreshToken,
      },
    };
  }

  async forgotPassword(payload: ForgotPasswordInput): Promise<string> {
    const { UserDataAccess, NotificationProvider, config } = this;
    const { email } = payload;

    const user = await UserDataAccess.findUserAuthByEmail(email);

    if (!user) {
      return 'Password Instruction Sent Successfully';
    }

    if (user?.userType !== payload.dashboardType) {
      throw new BadRequestError('Account not found', { code: 'USER_NOT_FOUND' });
    }

    const { expiryTime, verificationToken } = getVerificationCodeAndExpiry(30);

    await UserDataAccess.updateUserById(user._id, {
      resetPasswordToken: verificationToken,
      resetPasswordTokenExpiredAt: expiryTime,
    });

    let url;

    switch (payload.dashboardType) {
      case UserType.ADMINISTRATOR:
        url = `${config.get(
          'frontend.adminUrl',
        )}/reset-password?verificationToken=${verificationToken}&email=${email}`;
        break;
      case UserType.BUSINESS:
        url = `${config.get(
          'frontend.businessUrl',
        )}/reset-password?verificationToken=${verificationToken}&email=${email}`;
        break;
      case UserType.PARTNER:
        url = `${config.get(
          'frontend.partnerUrl',
        )}/reset-password?verificationToken=${verificationToken}&email=${email}`;
        break;

      default:
        url = `${config.get(
          'frontend.businessUrl',
        )}/reset-password?verificationToken=${verificationToken}&email=${email}`;
        break;
    }
    const emailContent = await forgotPasswordEmailContent({
      email,
      url,
    });

    await NotificationProvider.email.send({
      email,
      subject: 'Forgot Password',
      content: emailContent,
    });

    return 'Password Instruction Sent Successfully';
  }

  async resetPassword(payload: {
    email: string;
    password: string;
    verificationToken: string;
  }): Promise<string> {
    const { UserDataAccess, NotificationProvider } = this;

    const { email, password, verificationToken } = payload;

    const user = await UserDataAccess.findUserAuthByTokenAndEmail(email, verificationToken);

    if (!user) {
      throw new NotFoundError('Please confirm your email.', { code: 'MISSING_ACCOUNT' });
    }

    const hashedPassword = await user.hashPassword(password);

    await UserDataAccess.updateUserById(
      user._id,
      { password: hashedPassword, mustChangePassword: false },
      { resetPasswordToken: 1, resetPasswordTokenExpiredAt: 1 },
    );

    await NotificationProvider.email.send({
      email,
      subject: 'Password Reset Successfully',
      content: '<p>Your password has been changed successfully. </p>',
    });

    return 'Password changed successfully';
  }

  async refreshAccessToken({ userId }: RefreshAccessTokenInput) {
    const {
      UserDataAccess,
      AgentDataAccess,
      BusinessDataAccess,
      PartnerDataAccess,
      AdminDataAccess,
    } = this;

    const user = await UserDataAccess.findUserById(userId);

    if (!user) {
      throw new BadRequestError('Invalid User ID');
    }

    let businessId, partnerId, adminId, agentId;

    if (user.userType === UserType.BUSINESS) {
      const business = await BusinessDataAccess.findUserBusinessByUserId(user._id);

      if (!business) {
        throw new BadRequestError('Invalid Business User', { code: 'INVALID_BUSINESS_USER' });
      }

      if (!business.active) {
        throw new BadRequestError('Account has been suspended, please reach our to administrator', {
          code: 'BUSINESS_ACCOUNT_SUSPENDED',
        });
      }

      businessId = business._id;
    }

    if (user.userType === UserType.PARTNER) {
      const partner = await PartnerDataAccess.findUserPartnerByUserId(user._id);

      if (!partner) {
        throw new BadRequestError('Invalid Partner User', { code: 'INVALID_PARTNER_USER' });
      }

      if (!partner.active) {
        throw new BadRequestError('Account has been suspended, please reach our to administrator', {
          code: 'PARTNER_ACCOUNT_SUSPENDED',
        });
      }

      partnerId = partner._id;
    }

    if (user.userType === UserType.ADMINISTRATOR) {
      const admin = await AdminDataAccess.findAdminByUserId(user._id);

      if (!admin) {
        throw new BadRequestError('Invalid Admin Account', { code: 'INVALID_ADMIN_ACCOUNT' });
      }

      if (admin.status !== AdminStatusEnum.ACTIVE) {
        throw new ForbiddenError('Account has been suspended', { code: 'INVALID_ADMIN_ACCOUNT' });
      }

      adminId = admin._id;
    }

    if (user.userType === UserType.AGENT) {
      const agent = await AgentDataAccess.findByUserId(user._id);

      if (!agent) {
        throw new BadRequestError('Invalid Agent', { code: 'INVALID_AGENT' });
      }

      if ([AgentStatus.INACTIVE, AgentStatus.SUSPENDED].includes(agent?.status)) {
        throw new BadRequestError('Account is not active', { code: 'INACTIVE_ACCOUNT' });
      }

      await AgentDataAccess.updateAgentById(agent._id, { onlineStatus: AgentOnlineStatus.ONLINE });

      agentId = agent._id;
      partnerId = agent.partner;
    }

    const { accessToken, refreshToken } = await this.signJwtToken({
      ...user._doc,
      businessId,
      partnerId,
      adminId,
      agentId,
    });

    return {
      user: {
        id: user._id,
      },
      jwt: {
        accessToken,
        refreshToken,
      },
    };
  }
}
