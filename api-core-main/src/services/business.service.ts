import generateApiKey from 'generate-api-key';
import { startOfDay, subDays } from 'date-fns';
import generatePassword from 'generate-password';
import { publishAblyNotificationToAdmin } from '../utils/ably.notification';
import {
  InviteBusinessInput,
  CompleteInviteSignupInput,
  ReInviteBusinessInput,
  UpdateBusinessInput,
  InviteBusinessUserInput,
  FirstTimeBusinessUserChangePasswordInput,
  CreateBusinessVerificationsInput,
  ChangeBusinessPasswordInput,
  AttachRolesInput,
  SuspendUserInput,
  UploadBulkIdentityInput,
  UploadBulkAddressInput,
  FindBusinessByApiKeyInput,
  RestoreUserInput,
  RemoveBusinessCardInput,
  TaskExistsInput,
  SubmitConsomerIdentityInput,
} from '../schemas/business.schema';
import { AddressInput } from '../schemas/address.schema';
import { CreatePayArenaOrderInput } from '../schemas/identity.schema';
import {
  UserType,
  COUNTRY_CODES_NAMES_LOOKUP,
  REDIS_LOCATION_KEY,
  NotificationModelTypeEnum,
} from '../constants';
import {
  inviteBusinessEmailContent,
  newVerificationEmailContent,
  bulkAddressExportEmailContent,
  createBusinessUserEmailContent,
  bulkDuplicateExportEmailContent,
} from '../utils/email';
import { BadRequestError, InternalError, AuthFailureError } from '../errors/api.error';
import {
  paginationReqData,
  paginationMetaData,
  getVerificationCodeAndExpiry,
} from '../utils/helper';
import BusinessFormatter, { IBusinessFormatter } from '../formatters/business.formatter';
import CandidateFormatter, { ICandidateFormatter } from '../formatters/candidate.formatter';
import TaskFormatter, { ITaskFormatter } from '../formatters/task.formatter';
import TransactionFormatter, { ITransactionFormatter } from '../formatters/transaction.formatter';
import CardFormatter, { ICardFormatter } from '../formatters/card.formatter';
import ServiceFormatter, { IServiceFormatter } from '../formatters/service.formatter';
import TaskLogic from '../logics/task.logic';
import AddressLogic from '../logics/address.logic';
import { IIdentityServiceType } from '../models/provider.model';
import { ChargeTypeEnum, EntityEnum } from '../models/types/task.type';
import RoleFormatter, { IRoleFormatter } from '../formatters/role.formatter';
import BusinessUserFormatter, {
  IBusinessUserFormatter,
} from '../formatters/business-user.formatter';
import CommonLogic from '../logics/common.logic';
import { AddressStatusEnum } from '../models/types/address.type';
import IdentityLogic from '../logics/identity.logic';

export default class BusinessService {
  private readonly config;
  private readonly logger;
  private readonly Payarena;
  private readonly AblyClient;
  private readonly RedisClient;
  private readonly AgentService;
  private readonly RoleDataAccess;
  private readonly CardDataAccess;
  private readonly TaskDataAccess;
  private readonly UserDataAccess;
  private readonly AdminDataAccess;
  private readonly IdentityProvider;
  private readonly InviteDataAccess;
  private readonly ServiceDataAccess;
  private readonly AddressDataAccess;
  private readonly CloudinaryUploader;
  private readonly TransactionService;
  private readonly BusinessDataAccess;
  private readonly CandidateDataAccess;
  private readonly NotificationProvider;
  private readonly GoogleClientProvider;
  private readonly NotificationDataAccess;
  private readonly BusinessServiceDataAccess;
  private readonly BusinessCandidateDataAccess;

  constructor({
    config,
    logger,
    Payarena,
    AblyClient,
    RedisClient,
    AgentService,
    RoleDataAccess,
    CardDataAccess,
    TaskDataAccess,
    UserDataAccess,
    AdminDataAccess,
    IdentityProvider,
    InviteDataAccess,
    ServiceDataAccess,
    AddressDataAccess,
    CloudinaryUploader,
    TransactionService,
    BusinessDataAccess,
    CandidateDataAccess,
    NotificationProvider,
    GoogleClientProvider,
    NotificationDataAccess,
    BusinessServiceDataAccess,
    BusinessCandidateDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.logger = logger;
    this.Payarena = Payarena;
    this.AblyClient = AblyClient;
    this.RedisClient = RedisClient;
    this.AgentService = AgentService;
    this.RoleDataAccess = RoleDataAccess;
    this.CardDataAccess = CardDataAccess;
    this.TaskDataAccess = TaskDataAccess;
    this.UserDataAccess = UserDataAccess;
    this.AdminDataAccess = AdminDataAccess;
    this.IdentityProvider = IdentityProvider;
    this.InviteDataAccess = InviteDataAccess;
    this.ServiceDataAccess = ServiceDataAccess;
    this.AddressDataAccess = AddressDataAccess;
    this.CloudinaryUploader = CloudinaryUploader;
    this.TransactionService = TransactionService;
    this.BusinessDataAccess = BusinessDataAccess;
    this.CandidateDataAccess = CandidateDataAccess;
    this.NotificationProvider = NotificationProvider;
    this.GoogleClientProvider = GoogleClientProvider;
    this.NotificationDataAccess = NotificationDataAccess;
    this.BusinessServiceDataAccess = BusinessServiceDataAccess;
    this.BusinessCandidateDataAccess = BusinessCandidateDataAccess;
  }

  async findBusinessByID(businessId: string) {
    const { BusinessDataAccess } = this;

    const business = await BusinessDataAccess.findBusinessById(businessId);

    if (!business) {
      throw new BadRequestError('Invalid Business ID', { code: 'INVALID_BUSINESS_ID' });
    }

    return business;
  }

  async all(
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; businesses: IBusinessFormatter[] }> {
    const { BusinessDataAccess } = this;
    const { page = 1, size = 20, status } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);

    const [businesses] = await BusinessDataAccess.all({ status }, { offset, limit });

    const meta = paginationMetaData(
      businesses?.metadata[0]?.total,
      pageNum,
      offset,
      size as number,
    );

    return {
      meta,
      businesses: businesses?.data?.map((business: Record<string, unknown>) =>
        BusinessFormatter({ business }),
      ),
    };
  }

  async getBussinessById(businessId: string): Promise<IBusinessFormatter> {
    const { BusinessDataAccess } = this;

    const business = await BusinessDataAccess.findBusinessById(businessId);

    if (!business) {
      throw new BadRequestError('Invalid Business ID', { code: 'INVALID_BUSINESS_ID' });
    }

    return BusinessFormatter({ business });
  }

  async getBussinessMetrics(businessId: string, query: Record<string, unknown>) {
    const { TaskDataAccess } = this;

    const [business] = await TaskDataAccess.businessDashboardMetrics(businessId, query);

    return {
      totalVerifications: 0,
      totalCompleted: 0,
      totalPending: 0,
      totalCandidates: 0,
      ...business,
    };
  }

  async recentCandidates(businessId: string, limit: string): Promise<ICandidateFormatter> {
    const { BusinessDataAccess, BusinessCandidateDataAccess } = this;

    const business = await BusinessDataAccess.findBusinessById(businessId);

    if (!business) {
      throw new BadRequestError('Invalid Business ID', { code: 'INVALID_BUSINESS_ID' });
    }

    const candidates = await BusinessCandidateDataAccess.fetchLimitedCandidates(
      business._id,
      Number(limit) || 15,
    );

    return candidates.map((candidate: Record<string, unknown>) =>
      CandidateFormatter({ candidate: candidate?.candidate }),
    );
  }

  async allCandidates(businessId: string): Promise<ICandidateFormatter> {
    const { BusinessDataAccess, BusinessCandidateDataAccess } = this;

    const business = await BusinessDataAccess.findBusinessById(businessId);

    if (!business) {
      throw new BadRequestError('Invalid Business ID', { code: 'INVALID_BUSINESS_ID' });
    }

    const candidates = await BusinessCandidateDataAccess.fetchBusinessCandidates(business._id);

    return candidates.map((candidate: Record<string, unknown>) =>
      CandidateFormatter({ candidate: candidate?.candidate }),
    );
  }

  async recentVerifications(businessId: string, limit: string): Promise<ITaskFormatter> {
    const { BusinessDataAccess, TaskDataAccess } = this;

    const business = await BusinessDataAccess.findBusinessById(businessId);

    if (!business) {
      throw new BadRequestError('Invalid Business ID', { code: 'INVALID_BUSINESS_ID' });
    }

    const tasks = await TaskDataAccess.fetchLimitedVerifications(business._id, Number(limit) || 15);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return tasks.map((task: any) =>
      TaskFormatter({
        task: {
          ...task,
          candidate: task.candidate[0],
          address: task.address[0],
          identity: task.identity[0],
          bankStatement: task.bankStatement[0],
          // certificateDocument: task.certificateDocument[0],
        },
      }),
    );
  }

  async allVerifications(
    businessId: string,
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; tasks: ITaskFormatter[] }> {
    const { BusinessDataAccess, TaskDataAccess } = this;

    const {
      type,
      status,
      period,
      search,
      page = 1,
      size = 20,
      customEndDate,
      customStartDate,
    } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);

    const business = await BusinessDataAccess.findBusinessById(businessId);

    if (!business) {
      throw new BadRequestError('Invalid Business ID', { code: 'INVALID_BUSINESS_ID' });
    }

    const [tasks] = await TaskDataAccess.allBusinessVerifications(
      business._id,
      { status, period, type, search, customStartDate, customEndDate },
      { offset, limit },
    );

    const meta = paginationMetaData(tasks?.metadata[0]?.total, pageNum, offset, size as number);

    return {
      meta,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tasks: tasks?.data.map((task: any) =>
        TaskFormatter({
          task: {
            ...task,
            address: task.address[0],
            identity: task.identity[0],
            candidate: task.candidate[0],
            bankStatement: task.bankStatement[0],
            project: task.project[0],
            document: task.document[0],
            academicDocument: task.academicDocument[0],
          },
        }),
      ),
    };
  }

  async exportAddressVerifications({
    businessId,
    query,
  }: {
    businessId: string;
    query: Record<string, unknown>;
  }): Promise<boolean> {
    const { BusinessDataAccess, UserDataAccess, AddressDataAccess, NotificationProvider, logger } =
      this;

    const {
      period = 30,
      type,
      search,
      customStartDate = startOfDay(subDays(new Date(), 30)),
      customEndDate = new Date(),
      userId,
    } = query;

    const business = await BusinessDataAccess.findBusinessById(businessId);

    if (!business) {
      logger.error('Business ID not found');
      return false;
    }

    const user = await UserDataAccess.findUserById(userId);

    if (!user) {
      logger.error('User ID not found');
      return false;
    }

    const status =
      query.status === 'completed'
        ? [AddressStatusEnum.VERIFIED, AddressStatusEnum.FAILED]
        : query.status;

    const tasks = await AddressDataAccess.exportBusinessVerifications(business._id, {
      status,
      period,
      type,
      search,
      customStartDate,
      customEndDate,
    });

    const data = await CommonLogic.prepareAddressCsvData(tasks);

    const dataBuffer = await CommonLogic.writeDataToCsvReturnBuffer(data);

    const emailContent = await bulkAddressExportEmailContent({
      name: business?.name,
      email: business?.email,
    });

    NotificationProvider.email.send({
      email: user?.email ?? business?.email,
      content: emailContent,
      subject: 'Bulk Address Export',
      attachments: [
        {
          filename: `${business?.name}-address-attachment.csv`,
          content: dataBuffer,
        },
      ],
    });

    return true;
  }

  async allPaginatedCandidates(
    businessId: string,
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; candidates: ICandidateFormatter[] }> {
    const { BusinessCandidateDataAccess } = this;

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

    const business = await this.findBusinessByID(businessId);

    const [candidates] = await BusinessCandidateDataAccess.allPaginatedBusinessCandidates(
      business._id,
      { status, period, type, search, customStartDate, customEndDate },
      { offset, limit },
    );

    const meta = paginationMetaData(
      candidates?.metadata[0]?.total,
      pageNum,
      offset,
      size as number,
    );

    return {
      meta,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      candidates: candidates?.data.map((candidate: any) =>
        CandidateFormatter({ candidate: candidate?.candidate }),
      ),
    };
  }

  async invite(payload: InviteBusinessInput): Promise<string> {
    const { BusinessDataAccess, NotificationProvider, config } = this;

    const {
      businessName: name,
      email,
      address,
      cacNumber,
      countryCode,
      directorNin,
      phoneNumber,
    } = payload;

    const { verificationToken, expiryTime } = getVerificationCodeAndExpiry(60);

    await BusinessDataAccess.inviteBusiness(
      {
        name,
        email,
        address,
        cacNumber,
        countryCode,
        directorNin,
        phoneNumber,
      },
      {
        inviteToken: verificationToken,
        inviteTokenExpiry: expiryTime,
      },
    );

    const emailContent = await inviteBusinessEmailContent({
      name,
      url: `${config.get('frontend.businessUrl')}/complete-registration?token=${verificationToken}`,
    });

    await NotificationProvider.email.send({
      email,
      subject: `Business - ${name} Invite`,
      content: emailContent,
    });

    return 'Invite Sent Successfully';
  }

  async reInvite(payload: ReInviteBusinessInput): Promise<string> {
    const { NotificationProvider, InviteDataAccess } = this;

    const { inviteId, email } = payload;

    const { verificationToken, expiryTime } = getVerificationCodeAndExpiry(30);

    const invite = await InviteDataAccess.updateInviteById(inviteId, {
      inviteToken: verificationToken,
      inviteTokenExpiry: expiryTime,
    });

    if (!invite) {
      throw new BadRequestError('Invalid Invite ID.', { code: 'INVITE_NOT_FOUND' });
    }

    const emailContent = await inviteBusinessEmailContent({
      name: invite?.requestPayload?.name,
      url: `https://firstcheck.com/business`,
    });

    await NotificationProvider.email.send({
      email,
      subject: 'Business Invite',
      content: emailContent,
    });

    return 'Invite Resent Successfully';
  }

  async completeInviteSignup(payload: CompleteInviteSignupInput): Promise<string> {
    const { BusinessDataAccess, NotificationProvider, RoleDataAccess } = this;

    const { firstName, lastName, email, phoneNumber, inviteToken, password } = payload;

    const role = await RoleDataAccess.getBusinessSuperAdminRole();

    if (!role) {
      throw new BadRequestError('Invalid default role', { code: 'INVALID_DEFAULT_ROLE' });
    }

    await BusinessDataAccess.completeBusinessSignup({
      firstName,
      lastName,
      email,
      phoneNumber,
      inviteToken,
      password,
      role: role._id,
      api: {
        key: generateApiKey({
          method: 'string',
          prefix: 'key',
          length: 24,
          pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        }),
      },
    });

    const emailContent = await createBusinessUserEmailContent({
      firstName,
      lastName,
      url: `https://firstcheck.com/business`,
    });

    await NotificationProvider.email.send({
      email,
      subject: 'Business Invite',
      content: emailContent,
    });

    return 'Account Created Successfully';
  }

  async updateBusinessById(businessId: string, payload: UpdateBusinessInput): Promise<string> {
    const { BusinessDataAccess } = this;

    await BusinessDataAccess.updateBusinessById(businessId, {
      ...(payload?.businessName ? { name: payload.businessName } : undefined),
      ...(payload?.email ? { email: payload.email } : undefined),
      ...(payload?.address ? { address: payload.address } : undefined),
      ...(payload?.industry ? { industry: payload.industry } : undefined),
      ...(payload?.businessPhoneNumber ? { phoneNumber: payload.email } : undefined),
      ...(payload?.status ? { active: payload.status } : undefined),
    });

    return 'Business Updated Successfully';
  }

  async inviteBusinessUser(payload: InviteBusinessUserInput): Promise<string> {
    const { UserDataAccess, BusinessDataAccess, NotificationProvider } = this;

    const business = await this.getBussinessById(payload.businessId);

    const password = generatePassword.generate({
      length: 12,
      numbers: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const user = await UserDataAccess.createUserAccount({
      ...payload,
      email: payload?.email?.toLowerCase(),
      password,
      userType: UserType.BUSINESS,
      mustChangePassword: true,
      isPhoneNumberVerified: true,
      isEmailVerified: false,
      role: payload.role,
      country: {
        code: business?.country?.code,
        name: COUNTRY_CODES_NAMES_LOOKUP.get(business?.country?.code),
      },
    });

    if (!user) {
      throw new InternalError('Something went wrong create business account');
    }

    await BusinessDataAccess.pushAdminUsers(business._id, {
      users: {
        user: user?._id,
        role: payload.role,
      },
    });

    await NotificationProvider.email.send({
      email: payload.email,
      subject: `${payload.firstName} account created successfully`,
      content: `An account has been created for you to  join the business ${business?.name}, default password is <b>${password}</b>`,
    });

    return 'Account Created Successfully';
  }

  async createBusinessUser(payload: InviteBusinessUserInput): Promise<string> {
    const { UserDataAccess, RoleDataAccess, NotificationProvider } = this;

    const business = await this.getBussinessById(payload.businessId);

    const role = await RoleDataAccess.getRoleById(payload.role);

    if (!role) {
      throw new BadRequestError('Invalid Role ID', { code: 'ROLE_NOT_FOUND' });
    }

    const password = generatePassword.generate({
      length: 12,
      numbers: true,
    });

    await UserDataAccess.createBusinessUserAccount({
      ...payload,
      email: payload?.email?.toLowerCase(),
      password,
      userType: UserType.BUSINESS,
      mustChangePassword: true,
      isPhoneNumberVerified: true,
      isEmailVerified: false,
      role: payload.role,
      permissions: role.permissions,
      country: {
        code: business?.country?.code,
        name: COUNTRY_CODES_NAMES_LOOKUP.get(business?.country?.code),
      },
    });

    await NotificationProvider.email.send({
      email: payload.email,
      subject: `${payload.firstName} account created successfully`,
      content: `An account has been created for you to  join the business ${business?.name}, email ${payload.email} default password is <b>${password}</b>`,
    });

    return 'Account Created Successfully';
  }

  async firstTimeChangePassword(
    payload: FirstTimeBusinessUserChangePasswordInput,
  ): Promise<string> {
    const { UserDataAccess, BusinessDataAccess, NotificationProvider } = this;

    const { businessUserId, oldPassword, password } = payload;

    const business = await BusinessDataAccess.findBusinessByBusinessUserId(businessUserId);

    const businessUser = business?.users.find(
      (user: Record<string, unknown>) => String(user._id) === businessUserId,
    );

    const user = await UserDataAccess.findUserById(businessUser?.user);

    if (!user || !(await user.comparePasswords(oldPassword, user.password))) {
      throw new AuthFailureError('User Credentials does not match.', {
        code: 'CREDENTIALS_NOT_MATCH',
      });
    }

    const hashedPassword = await user.hashPassword(password);

    await Promise.all([
      UserDataAccess.updateUserById(user._id, {
        password: hashedPassword,
        mustChangePassword: false,
      }),
      BusinessDataAccess.updateUserStatus(business._id, businessUser._id),
    ]);

    await NotificationProvider.email.send({
      email: user.email,
      subject: `${user.firstName} password changed successfully`,
      content: `Password has been changed successfully, default password is <b>${password}</b>`,
    });

    return 'Account Created Successfully';
  }

  async findVerificationByID({ businessId, candidateId }: Record<string, unknown>) {
    const { TaskDataAccess } = this;

    const tasks = await TaskDataAccess.fetchTaskByBusinessCandidateID(businessId, candidateId);

    return {
      candidate: CandidateFormatter({ candidate: tasks[0]?.candidate }),
      verifications: TaskLogic.formatTaskResult(tasks),
    };
  }

  async getBusinessCandidateById({ businessId, candidateId }: Record<string, unknown>) {
    const { BusinessCandidateDataAccess } = this;

    const { candidate } = await BusinessCandidateDataAccess.fetchBusinessCandidateById(
      businessId,
      candidateId,
    );

    if (!candidate) {
      throw new BadRequestError('Candidate not found', {
        code: 'CANDIDATE_NOT_FOUND',
      });
    }

    return CandidateFormatter({ candidate });
  }

  async getBusinessServices(businessId: string) {
    const { ServiceDataAccess, BusinessServiceDataAccess } = this;

    let businessServices = await BusinessServiceDataAccess.allBusinessServices(businessId);

    if (!businessServices.length) {
      businessServices = await ServiceDataAccess.allServices();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return businessServices.map((service: any) =>
      ServiceFormatter({
        service: {
          ...service,
          ...(service?.service ? service?.service : undefined),
          price: service?.price,
        },
      }),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async calculateVerificationPrice(businessId: string, verifications: any) {
    let costOfVerification = {
      total: 0,
    };

    const services = await this.getBusinessServices(businessId);

    costOfVerification = TaskLogic.calculateVerificationCost(services, verifications);

    return costOfVerification;
  }

  async chargeBusinessSavedCards(
    businessId: string,
    email: string,
    userId: string,
    amount: number,
  ) {
    const { TransactionService, CardDataAccess } = this;

    const cards = await CardDataAccess.allBusinessCards(businessId);

    if (!cards.length) {
      throw new BadRequestError('Business has no saved cards', { code: 'CARD_NOT_FOUND' });
    }

    for (const card of cards) {
      const chargeResponse = await TransactionService.chargeBusinessCard(
        businessId,
        email,
        userId,
        card.authorizationCode,
        amount,
      );

      if (chargeResponse) {
        break;
      }
    }

    return 'Successfully Charged Card';
  }

  async chargeBusinessSavedCardByID(
    cardId: string,
    businessId: string,
    email: string,
    userId: string,
    amount: number,
  ) {
    const { TransactionService, CardDataAccess } = this;

    const card = await CardDataAccess.findReusableCardById(cardId);

    if (!card) {
      throw new BadRequestError('Card ID not found', { code: 'CARD_NOT_FOUND' });
    }

    const chargeResponse = await TransactionService.chargeBusinessCard(
      businessId,
      email,
      userId,
      card.authorizationCode,
      amount,
    );

    if (!chargeResponse) {
      throw new BadRequestError('Charge Attempt Failed on selected card', {
        code: 'CHARGE_ATTEMPT_FAILED',
      });
    }
    return 'Successfully Charged Card';
  }

  async createVerifications(
    payload: CreateBusinessVerificationsInput,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response?: any,
    notify = true,
  ) {
    const { CandidateDataAccess, TaskDataAccess, GoogleClientProvider, BusinessDataAccess } = this;

    if (!payload.forceCreate) {
      const verificationExists = await this.checkCandidateTaskExists({
        business: payload.businessId,
        candidate: payload.candidateId,
        verifications: Object.keys(payload.verifications),
      });

      if (verificationExists.taskExists) {
        throw new BadRequestError('Verification Already Exists', { code: 'VERIFICATION_EXISTS' });
      }
    }

    let business;

    if (payload.verifications.identity && !response) {
      response = await this.requestIdentity(
        payload.verifications.identity.type,
        payload.verifications.identity.idNumber,
        payload.countryCode,
        payload.verifications.identity?.lastName,
      );
    }

    if (payload.verifications.aml && !response) {
      response = await this.requestAmlExternally(
        IIdentityServiceType.AML,
        payload.verifications.aml.type,
        payload.verifications.aml.name,
      );
    }

    const [candidate, businessData] = await Promise.all([
      CandidateDataAccess.findCandidateById(payload.candidateId),
      BusinessDataAccess.findBusinessById(payload.businessId),
    ]);

    business = businessData;

    if (!candidate && payload?.verifications?.address) {
      throw new BadRequestError('Invalid Candidate ID.', { code: 'CANDIDATE_NOT_FOUND' });
    }

    if (!business) {
      throw new BadRequestError('Invalid Business ID', { code: 'BUSINESS_NOT_FOUND' });
    }

    const costOfVerification = await this.calculateVerificationPrice(
      payload.businessId,
      payload.verifications,
    );

    if (payload.chargeType === ChargeTypeEnum.CARD) {
      await this.chargeBusinessSavedCardByID(
        payload?.card as string,
        business._id,
        business.email,
        payload.userId,
        costOfVerification.total,
      );
      business = await BusinessDataAccess.findBusinessById(payload.businessId);
    }

    let stringifiedAddress, longitude, latitude;

    if (payload.verifications.address) {
      stringifiedAddress = await AddressLogic.stringifyAddress(
        payload.verifications.address as AddressInput,
      );

      const position = await GoogleClientProvider.geocodeAddress(stringifiedAddress);
      longitude = position.longitude;
      latitude = position.latitude;
    }

    if (payload.verifications.businessVerification) {
      stringifiedAddress = await AddressLogic.stringifyAddress(
        payload.verifications.businessVerification.address as AddressInput,
      );

      const position = await GoogleClientProvider.geocodeAddress(stringifiedAddress);
      longitude = position.longitude;
      latitude = position.latitude;
    }

    let payArenaData;
    if (payload.verifications.bankStatement) {
      payArenaData = await this.createBankStatement(
        payload.verifications.bankStatement.orderId as string,
      );
    }

    const task = await TaskDataAccess.createVerifications({
      ...payload,
      paymentType: payload.chargeType,
      entityType: payload.entityType,
      cost: costOfVerification.total,
      business,
      costOfVerification,
      formatAddress: stringifiedAddress,
      identityResponse: response,
      failedReason: response?.failedReason,
      chargeIdentity: response?.chargeIdentity,
      validationData: payload?.verifications?.identity?.validationData || {
        firstName: candidate?.firstName,
        lastName: candidate?.lastName,
        dateOfBirth: candidate?.dateOfBirth,
      },
      responseStatus: response?.status,
      position: {
        longitude,
        latitude,
      },
      bankStatementResponse: payArenaData,
    });

    const taskData = await TaskDataAccess.fetchTaskByID(task?._id);

    // if (payload.verifications.address) {
    //   await this.assignTaskToAgent(candidate, taskData._id, taskData?.address, {
    //     longitude,
    //     latitude,
    //     stringifiedAddress,
    //   });
    // }

    if (notify) {
      //@TODO  notify admin
      this.sendVerificationAdminEmail(business, taskData);
    }

    return TaskFormatter({ task: taskData });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendVerificationAdminEmail(business: Record<string, unknown>, taskData: any) {
    const {
      AdminDataAccess,
      RoleDataAccess,
      NotificationDataAccess,
      NotificationProvider,
      config,
    } = this;

    const roles = await RoleDataAccess.getAdminSuperAdminsRole();

    const superAdminEmails = await AdminDataAccess.findAdminByUserIds(
      roles.map((role: Record<string, unknown>) => role._id),
    );
    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      superAdminEmails.map(async (user: any) => {
        const emailContent = await newVerificationEmailContent({
          business: business?.name as string,
          email: user?.user?.email,
          url: `${config.get('frontend.adminUrl')}/addresses/${taskData?.address?._id}`,
        });

        return NotificationProvider.email.send({
          email: user?.user?.email,
          content: emailContent,
          subject: 'New Job Entry',
        });
      }),
    );

    // for (const user of superAdminEmails) {
    //   const emailContent = await newVerificationEmailContent({
    //     business: business?.name as string,
    //     email: user?.user?.email,
    //     url: `${config.get('frontend.adminUrl')}/addresses/${taskData?.address?._id}`,
    //   });

    //   NotificationProvider.email.send({
    //     email: user?.user?.email,
    //     content: emailContent,
    //     subject: 'New Job Entry',
    //   });
    // }

    await Promise.all([
      NotificationDataAccess.create({
        actor: business?._id,
        title: `${business?.name} added a new Task ${taskData?._id}`,
        text: `${business?.name}  added a new Task ${taskData?._id} address: ${taskData?.address?.formatAddress}`,
        modelId: taskData?.business?._id,
        modelType: NotificationModelTypeEnum.ADMIN,
        isRead: false,
      }),

      publishAblyNotificationToAdmin(this.AblyClient, {
        title: `${business?.name} added a new Task ${taskData?._id}`,
        content: `${business?.name}  added a new Task ${taskData?._id} address: ${taskData?.address?.formatAddress}`,
      }),
    ]);

    return true;
  }

  async createBankStatement(orderId: string) {
    const { Payarena } = this;

    const payArenaData = await Payarena.fetchResult({
      orderId,
      institutionCode: 3,
    });

    return payArenaData;
  }

  async requestIdentity(
    type: IIdentityServiceType,
    id: string,
    countryCode: string,
    lastName?: string,
  ) {
    const { IdentityProvider } = this;

    await IdentityProvider.setVerificationType(type);

    let response;

    switch (type) {
      case IIdentityServiceType.NIN:
        response = await IdentityProvider.fetchNin(id, countryCode);
        break;
      case IIdentityServiceType.BVN:
        response = await IdentityProvider.fetchBvn(id, countryCode);
        break;
      case IIdentityServiceType.DL:
        response = await IdentityProvider.fetchDriverLicense(id, countryCode);
        break;
      case IIdentityServiceType.PASSPORT:
        response = await IdentityProvider.fetchPassport(id, countryCode, lastName);
        break;
      default:
        throw new BadRequestError('Invalid Identity Type');
    }

    return response;
  }

  async requestAmlExternally(type: IIdentityServiceType, searchType: string, name: string) {
    const { IdentityProvider } = this;

    await IdentityProvider.setVerificationType(type);

    const response = await IdentityProvider.fetchAml(name, searchType);

    return response;
  }

  async assignTaskToAgent(
    candidate: Record<string, unknown>,
    taskId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    address: any,
    {
      longitude,
      latitude,
      stringifiedAddress,
    }: { longitude: number; latitude: number; stringifiedAddress?: string },
  ) {
    const { AgentService, AblyClient, AddressDataAccess } = this;
    const agents = await AgentService.fetchAgentWithAddressLocation({
      longitude,
      latitude,
      state: address?.details?.state,
    });

    await TaskLogic.assignTaskToAgent(AblyClient, AddressDataAccess, {
      agents,
      body: {
        verificationId: taskId,
        addressId: address?._id as string,
        landmark: address?.details?.landmark as string,
        candidate: {
          firstName: candidate?.firstName as string,
          lastName: candidate?.lastName as string,
          phoneNumber: candidate?.phoneNumber as string,
        },
        address: stringifiedAddress as string,
      },
      position: {
        longitude,
        latitude,
      },
    });
  }

  async allTransactions(
    businessId: string,
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; transactions: ITransactionFormatter[] }> {
    const { TransactionService } = this;

    const business = await this.findBusinessByID(businessId);

    const { meta, transactions } = await TransactionService.businessTransactions(
      business._id,
      query,
    );

    return {
      meta,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transactions: transactions?.data.map((transaction: any) =>
        TransactionFormatter({
          transaction: {
            ...transaction,
            address: transaction.address[0] ?? undefined,
            identity: transaction.identity[0] ?? undefined,
            user: transaction.user[0] ?? undefined,
            task: transaction.task[0] ?? undefined,
          },
        }),
      ),
    };
  }

  async allCards(businessId: string): Promise<ICardFormatter[]> {
    const { BusinessDataAccess, CardDataAccess } = this;

    const business = await BusinessDataAccess.findBusinessById(businessId);

    if (!business) {
      throw new BadRequestError('Invalid Business ID', { code: 'INVALID_BUSINESS_ID' });
    }

    const cards = await CardDataAccess.allBusinessCards(business._id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return cards.map((card: any) => CardFormatter({ card }));
  }

  async allServices(businessId: string): Promise<IServiceFormatter[]> {
    const { BusinessDataAccess, ServiceDataAccess, BusinessServiceDataAccess } = this;

    const business = await BusinessDataAccess.findBusinessById(businessId);

    if (!business) {
      throw new BadRequestError('Invalid Business ID', { code: 'INVALID_BUSINESS_ID' });
    }

    let businessServices = await BusinessServiceDataAccess.allBusinessServices(business._id);

    if (!businessServices.length) {
      businessServices = await ServiceDataAccess.allServices();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return businessServices.map((service: any) =>
      ServiceFormatter({
        service: {
          ...service,
          ...(service?.service ? service?.service : undefined),
          price: service?.price,
        },
      }),
    );
  }

  async walletBalance(businessId: string) {
    const { TransactionService } = this;

    const business = await this.findBusinessByID(businessId);

    const totalVerificationCost = await TransactionService.calculateTotalVerificationCost(
      business._id,
    );

    return {
      ...business?.wallet,
      totalVerificationCost,
    };
  }

  async changeBusinessUserPassword(payload: ChangeBusinessPasswordInput): Promise<string> {
    const { BusinessDataAccess, UserDataAccess } = this;

    const { business, user, oldPassword, password } = payload;

    const businessData = await BusinessDataAccess.findBusinessById(business);

    if (!businessData) {
      throw new BadRequestError('Invalid Business ID', { code: 'BUSINESS_NOT_FOUND' });
    }

    const userData = await UserDataAccess.findUserAuthById(user);

    if (!userData) {
      throw new BadRequestError('Invalid User ID', { code: 'AGENT_USER_CONFLICT' });
    }

    if (!(await userData.comparePasswords(oldPassword, userData.password))) {
      throw new AuthFailureError('Old Password not match', {
        code: 'PASSWORD_NOT_MATCH',
      });
    }

    await UserDataAccess.updateUserById(userData._id, {
      password: await userData.hashPassword(password),
      mustChangePassword: false,
    });

    return 'Password Changed Successfully';
  }

  async attachRole(payload: AttachRolesInput): Promise<string> {
    const { BusinessDataAccess, RoleDataAccess, RedisClient } = this;

    const { business, user, role } = payload;

    const businessData = await BusinessDataAccess.findBusinessById(business);

    if (!businessData) {
      throw new BadRequestError('Invalid Business ID', { code: 'BUSINESS_NOT_FOUND' });
    }

    const businesUser = businessData.users.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (userItem: any) => String(userItem?.user?._id) === user || String(businessData.user) === user,
    );

    if (!businesUser) {
      throw new BadRequestError('Invalid Business User ID', { code: 'BUSINESS_USER_NOT_FOUND' });
    }

    const roleData = await RoleDataAccess.getRoleById(payload.role);

    if (!roleData) {
      throw new BadRequestError('Invalid Role ID', { code: 'ROLE_NOT_FOUND' });
    }

    await RedisClient.hSet(
      REDIS_LOCATION_KEY.PERMISSION,
      String(user),
      JSON.stringify(roleData.permissions),
    );

    await BusinessDataAccess.updateBusinessUserRole(business, user, role);

    return 'Role Changed Successfully';
  }

  async getBussinessRoles(businessId: string): Promise<IRoleFormatter> {
    const { RoleDataAccess } = this;

    const business = await this.findBusinessByID(businessId);

    const roles = await RoleDataAccess.allBusinessRoles(business._id);

    return roles.map((role: Record<string, unknown>) => RoleFormatter({ role }));
  }

  async suspendBusinessUser(payload: SuspendUserInput): Promise<string> {
    const { BusinessDataAccess } = this;

    const business = await this.findBusinessByID(payload.business);

    await BusinessDataAccess.suspendBusinessUser(business._id, payload.user);

    return 'User Suspended Successfully';
  }

  async businessUsers(businessId: string): Promise<IBusinessUserFormatter> {
    const business = await this.findBusinessByID(businessId);

    return business?.users.map((user: Record<string, unknown>) =>
      BusinessUserFormatter({ businessUser: user }),
    );
  }

  async getBusinessUserByID(params: {
    businessId: string;
    userId: string;
  }): Promise<IBusinessUserFormatter> {
    const business = await this.findBusinessByID(params.businessId);

    const businessUser = business?.users.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (businessUser: any) => String(businessUser?.user?._id) === params.userId,
    );

    if (!businessUser) {
      throw new BadRequestError('Invalid Business User Profile', { code: 'INVALID_BUSINESS_USER' });
    }

    return BusinessUserFormatter({ businessUser });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createBusinessIndividualIdentity(payload: any, type: IIdentityServiceType) {
    const { CandidateDataAccess } = this;

    const response = await this.requestIdentity(
      type,
      payload?.id as string,
      payload.countryCode,
      payload?.lastName,
    );

    const validationData = payload.validationData;

    const candidate = await CandidateDataAccess.createQueueCandidate({
      email: response.email,
      businessId: payload.businessId,
      lastName: validationData?.lastName || response.lastName,
      firstName: validationData?.firstName || response.firstName,
      middleName: validationData?.middleName || response.middleName,
      dateOfBirth: validationData?.dateOfBirth || response.dateOfBirth,
      phoneNumber: response.phoneNumber,
    });

    return this.createVerifications(
      {
        chargeType: ChargeTypeEnum.WALLET,
        countryCode: 'NG',
        businessId: payload.businessId,
        userId: payload.userId,
        candidateId: candidate?._id,
        entityType: payload?.entityType ?? EntityEnum.BUSINESS,
        verifications: {
          identity: {
            idNumber: payload.id as string,
            type: type as IIdentityServiceType,
            dateOfBirth: validationData?.dateOfBirth || response.dateOfBirth,
            lastName: payload?.lastName,
            validationData: {
              lastName: validationData?.lastName || response.lastName,
              firstName: validationData?.firstName || response.firstName,
              dateOfBirth: validationData?.dateOfBirth || response.dateOfBirth,
            },
          },
        },
      },
      response,
      false,
    );
  }

  async checkCandidateTaskExists(payload: TaskExistsInput) {
    const { TaskDataAccess } = this;

    for (const verification of payload.verifications) {
      if (!payload.candidate || payload.candidate === '') {
        throw new BadRequestError('Candidate not found.', { code: 'CANDIDATE_NOT_FOUND' });
      }
      const taskExists = await TaskDataAccess.getTaskByBusinessAndCandidate({
        business: payload.business,
        candidate: payload.candidate,
        verification,
      });

      if (taskExists) {
        return {
          taskExists: true,
          message: 'Candidate verification exists',
        };
      }
    }

    return {
      taskExists: false,
      message: 'Task does not exists in business',
    };
  }

  async createBusinessBulkIdentity(payload: UploadBulkIdentityInput) {
    const { CandidateDataAccess, NotificationProvider } = this;
    const records = await CommonLogic.extractValuesFromCsv(payload.url);

    const business = await this.findBusinessByID(payload.business);

    const duplicateData = [];
    for (const record of records) {
      const candidateExists = await CandidateDataAccess.candidatesExists({
        email: record.candidateEmail,
        phoneNumber: record.candidatePhoneNumber,
        idNumber: record.identityNumber,
      });

      if (candidateExists.candidateExits) {
        if (!payload.forceCreate) {
          const candidateIds = candidateExists.candidates.map(
            (candidate: Record<string, unknown>) => candidate._id,
          );

          const candidateBusinessExists = await CandidateDataAccess.candidatesExistsInBusiness(
            candidateIds,
            payload.business,
          );

          if (candidateBusinessExists) {
            const taskExists = await this.checkCandidateTaskExists({
              business: payload.business,
              candidate: candidateBusinessExists?.candidate,
              verifications: ['identity'],
            });

            if (taskExists.taskExists) {
              duplicateData.push({
                lastName: record.candidateLastName,
                firstName: record.candidateFirstName,
                middleName: record.candidateMiddleName,
                dateOfBirth: record.candidateDateOfBirth,
                phoneNumber: record.candidatePhoneNumber,
                identityNumber: record.identityNumber,
                identityType: record.identityType,
              });
              continue;
            }
          }
        }
      }
      const candidate = await CandidateDataAccess.createQueueCandidate({
        email: record.candidateEmail,
        businessId: payload.business,
        lastName: record.candidateLastName,
        firstName: record.candidateFirstName,
        middleName: record.candidateMiddleName,
        dateOfBirth: record.candidateDateOfBirth,
        phoneNumber: record.candidatePhoneNumber,
      });

      this.createVerifications(
        {
          forceCreate: true,
          chargeType: ChargeTypeEnum.WALLET,
          countryCode: 'NG',
          businessId: payload.business,
          userId: payload.user,
          candidateId: candidate._id,
          entityType: (payload?.entityType ?? EntityEnum.BUSINESS) as EntityEnum,
          verifications: {
            identity: {
              idNumber: record.identityNumber as string,
              type: record.identityType as IIdentityServiceType,
              dateOfBirth: record.candidateDateOfBirth as string,
            },
          },
        },
        null,
        false,
      );
    }

    const data = await CommonLogic.prepareDuplicatedIdentityCsvData(duplicateData);

    const dataBuffer = await CommonLogic.writeDataToCsvReturnBuffer(data);

    const emailContent = await bulkDuplicateExportEmailContent({
      name: business?.name,
      email: business?.email,
    });

    await NotificationProvider.email.send({
      email: business?.email,
      content: emailContent,
      subject: 'Duplicate Upload File',
      attachments: [
        {
          filename: `upload-duplicate-attachment.csv`,
          content: dataBuffer,
        },
      ],
    });

    return true;
  }

  async createBusinessBulkAddress(payload: UploadBulkAddressInput) {
    const { CandidateDataAccess, NotificationProvider } = this;
    const records = await CommonLogic.extractValuesFromCsv(payload.url);
    // const { csvStream } = createFileStream(payload.business, ['firstName', 'lastName', 'phoneNumber', 'dateOfBirth', 'addressBuildingNumber', 'addressStreet', 'addressCity', 'addressState']);

    const business = await this.findBusinessByID(payload.business);

    const duplicateData = [];
    const errorData = [];
    for (const record of records) {
      const candidateExists = await CandidateDataAccess.candidatesExists({
        email: record.candidateEmail,
        phoneNumber: record.candidatePhoneNumber,
        idNumber: record.identityNumber,
      });

      if (candidateExists.candidateExits) {
        if (!payload.forceCreate) {
          const candidateIds = candidateExists.candidates.map(
            (candidate: Record<string, unknown>) => candidate._id,
          );

          const candidateBusinessExists = await CandidateDataAccess.candidatesExistsInBusiness(
            candidateIds,
            payload.business,
          );

          if (candidateBusinessExists) {
            const taskExists = await this.checkCandidateTaskExists({
              business: payload.business,
              candidate: candidateBusinessExists?.candidate,
              verifications: ['address'],
            });

            if (taskExists.taskExists) {
              duplicateData.push({
                lastName: record.candidateLastName,
                firstName: record.candidateFirstName,
                middleName: record.candidateMiddleName,
                dateOfBirth: record.candidateDateOfBirth,
                phoneNumber: record.candidatePhoneNumber,
                identityNumber: record.identityNumber,
                addressBuildingNumber: record.addressBuildingNumber,
                addressStreet: record.addressStreet,
                addressCity: record.addressCity,
                addressState: record.addressState,
              });
              continue;
            }
          }
        }
      }

      const candidate = await CandidateDataAccess.createQueueCandidate({
        firstName: record.candidateFirstName,
        lastName: record.candidateLastName,
        middleName: record.candidateMiddleName,
        email: record.candidateEmail,
        phoneNumber: record.candidatePhoneNumber,
        dateOfBirth: record.candidateDateOfBirth,
        businessId: payload.business,
      });

      try {
        this.createVerifications(
          {
            forceCreate: payload.forceCreate,
            chargeType: ChargeTypeEnum.WALLET,
            countryCode: 'NG',
            businessId: payload.business,
            userId: payload.user,
            candidateId: candidate._id,
            tat: record?.tat as number,
            entityType: (payload?.entityType ?? EntityEnum.BUSINESS) as EntityEnum,
            verifications: {
              address: {
                street: record.addressStreet as string,
                subStreet: record.addressSubstreet as string,
                buildingNumber: record.addressBuildingNumber as string,
                buildingName: record.addressBuildingName as string,
                lga: record.addressLga as string,
                landmark: record.addressLandmark as string,
                state: record.addressState as string,
                country: 'NG',
              },
            },
          },
          null,
          false,
        );
      } catch (err) {
        errorData.push({
          lastName: record.candidateLastName,
          firstName: record.candidateFirstName,
          middleName: record.candidateMiddleName,
          dateOfBirth: record.candidateDateOfBirth,
          phoneNumber: record.candidatePhoneNumber,
          identityNumber: record.identityNumber,
          addressBuildingNumber: record.addressBuildingNumber,
          addressStreet: record.addressStreet,
          addressCity: record.addressCity,
          addressState: record.addressState,
        });
        continue;
      }
    }

    if (!duplicateData.length) {
      return true;
    }

    const data = await CommonLogic.prepareDuplicatedAddressCsvData(duplicateData);
    const errorAddressData = await CommonLogic.prepareDuplicatedAddressCsvData(errorData);

    const dataBuffer = await CommonLogic.writeDataToCsvReturnBuffer(data);
    const errorDataBuffer = await CommonLogic.writeDataToCsvReturnBuffer(errorAddressData);

    const emailContent = await bulkDuplicateExportEmailContent({
      name: business?.name,
      email: business?.email,
    });

    await NotificationProvider.email.send({
      email: business?.email,
      content: emailContent,
      subject: 'Verification upload',
      attachments: [
        {
          filename: `${business?.name}-upload-duplicate-attachment.csv`,
          content: dataBuffer,
        },
        {
          filename: `${business?.name}-upload-error-attachment.csv`,
          content: errorDataBuffer,
        },
      ],
    });

    return true;
  }

  async findBusinessByApiKey(payload: FindBusinessByApiKeyInput): Promise<IBusinessFormatter> {
    const { BusinessDataAccess } = this;

    const business = await BusinessDataAccess.findByApiKey(payload.apiKey);

    if (!business) {
      throw new BadRequestError('Invalid Business API Key', { code: 'INVALID_BUSINESS_KEY' });
    }

    return BusinessFormatter({ business });
  }

  async restoreBusinessUser(payload: RestoreUserInput): Promise<string> {
    const { BusinessDataAccess } = this;

    const business = await this.findBusinessByID(payload.business);

    await BusinessDataAccess.restoreBusinessUser(business._id, payload.user);

    return 'User Restored Successfully';
  }

  async getPayArenaOrder(payload: CreatePayArenaOrderInput) {
    const { Payarena, config } = this;

    await this.findBusinessByID(payload.business);

    const payArenaData = await Payarena.createOrderId();

    return {
      ...payArenaData,
      redirectUrl: `${config.get('payarena.url')}/bank-statement/${payArenaData.orderId}`,
    };
  }

  async removeBusinessCard(payload: RemoveBusinessCardInput) {
    const { CardDataAccess } = this;

    const business = await this.findBusinessByID(payload.business);

    await CardDataAccess.deleteCardById(payload.card, business._id);

    return 'Card Removed Successfully';
  }

  async getCandidateBusinessVerifications(
    businessId: string,
    candidateId: string,
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; tasks: ITaskFormatter[] }> {
    const { BusinessDataAccess, TaskDataAccess } = this;

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

    const business = await BusinessDataAccess.findBusinessById(businessId);

    if (!business) {
      throw new BadRequestError('Invalid Business ID', { code: 'INVALID_BUSINESS_ID' });
    }

    const [tasks] = await TaskDataAccess.allBusinessCandidatesVerifications(
      business._id,
      candidateId,
      { status, period, type, search, customStartDate, customEndDate },
      { offset, limit },
    );

    const meta = paginationMetaData(tasks?.metadata[0]?.total, pageNum, offset, size as number);

    return {
      meta,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tasks: tasks?.data.map((task: any) =>
        TaskFormatter({
          task: {
            ...task,
            candidate: task.candidate[0],
            address: task.address[0],
            identity: task.identity[0],
            bankStatement: task.bankStatement[0],
          },
        }),
      ),
    };
  }

  async submitConsumerIdentity(payload: SubmitConsomerIdentityInput): Promise<string> {
    const { TaskDataAccess } = this;
    const { type, idNumber, firstName, lastName, verificationId } = payload;

    const response = await this.requestIdentity(
      type as IIdentityServiceType,
      idNumber,
      'NG',
      lastName,
    );

    const validationResult = IdentityLogic.validate({ firstName, lastName }, response);

    await TaskDataAccess.updateTaskById(verificationId, {
      firstName,
      lastName,
      type,
      idNumber,
      verified: validationResult?.lastName?.matched && validationResult?.firstName?.matched,
    });

    return 'Submited Successfully';
  }
}
