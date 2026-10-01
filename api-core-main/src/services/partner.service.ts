// import { startOfDay, subDays } from 'date-fns';
import generatePassword from 'generate-password';
import {
  InvitePartnerInput,
  CompleteInviteSignupInput,
  ReInvitePartnerInput,
  UpdatePartnerInput,
  InvitePartnerUserInput,
  FirstTimePartnerUserChangePasswordInput,
  ReAssignTaskInput,
  ReAssignTaskAllInput,
  // UpdatePartnerAgentInput,
  ChangePasswordInput,
  AttachRolesInput,
  SuspendUserInput,
  SuspendAgentInput,
  UnflaggedVerificationInput,
  UpsertBankInput,
  WithdrawPartnerFundInput,
} from '../schemas/partner.schema';
import { PaymentTypeEnum } from '../models/types/partner-transaction.type';
import { UserType, COUNTRY_CODES_NAMES_LOOKUP, REDIS_LOCATION_KEY } from '../constants';
import { invitePartnerEmailContent, createPartnerUserEmailContent } from '../utils/email';
import { BadRequestError, AuthFailureError, InternalError } from '../errors/api.error';
import {
  paginationReqData,
  paginationMetaData,
  generateUniqueReference,
  getVerificationCodeAndExpiry,
} from '../utils/helper';
import PartnerFormatter, { IPartnerFormatter } from '../formatters/partner.formatter';
import PartnerWithdrawalFormatter, {
  IPartnerWithdrawalFormatter,
} from '../formatters/partner-withdrawal.formatter';
import PartnerUserFormatter, { IPartnerUserFormatter } from '../formatters/partner-user.formatter';
import AddressFormatter, { IAddressFormatter } from '../formatters/address.formatter';
import AgentFormatter, { IAgentFormatter } from '../formatters/agent.formatter';
import RoleFormatter, { IRoleFormatter } from '../formatters/role.formatter';
import TaskLogic from '../logics/task.logic';
import { AgentOnlineStatus } from '../models/types/agent.type';
import { AddressStatusEnum } from '../models/types/address.type';
import EventEmitterBroker from '../events';
import { unflaggedAddressEmailContent } from '../utils/email';
// import CommonLogic from '../logics/common.logic';

export default class PartnerService {
  private readonly config;
  private readonly AblyClient;
  private readonly RedisClient;
  private readonly AgentService;
  private readonly RoleDataAccess;
  private readonly UserDataAccess;
  private readonly TaskDataAccess;
  private readonly AgentDataAccess;
  private readonly InviteDataAccess;
  private readonly PaystackProvider;
  private readonly PartnerDataAccess;
  private readonly AddressDataAccess;
  private readonly NotificationProvider;
  private readonly AgentTransactionDataAccess;
  private readonly PartnerTransactionDataAccess;

  constructor({
    config,
    AblyClient,
    RedisClient,
    AgentService,
    RoleDataAccess,
    UserDataAccess,
    TaskDataAccess,
    AgentDataAccess,
    InviteDataAccess,
    PaystackProvider,
    PartnerDataAccess,
    AddressDataAccess,
    NotificationProvider,
    AgentTransactionDataAccess,
    PartnerTransactionDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.AblyClient = AblyClient;
    this.RedisClient = RedisClient;
    this.AgentService = AgentService;
    this.RoleDataAccess = RoleDataAccess;
    this.UserDataAccess = UserDataAccess;
    this.TaskDataAccess = TaskDataAccess;
    this.AgentDataAccess = AgentDataAccess;
    this.InviteDataAccess = InviteDataAccess;
    this.PaystackProvider = PaystackProvider;
    this.PartnerDataAccess = PartnerDataAccess;
    this.AddressDataAccess = AddressDataAccess;
    this.NotificationProvider = NotificationProvider;
    this.AgentTransactionDataAccess = AgentTransactionDataAccess;
    this.PartnerTransactionDataAccess = PartnerTransactionDataAccess;
  }

  async allPartners(query: Record<string, unknown>): Promise<{ partners: IPartnerFormatter[] }> {
    const { PartnerDataAccess } = this;

    const partners = await PartnerDataAccess.allPartners(query);

    return partners?.map((partner: Record<string, unknown>) => PartnerFormatter({ partner }));
  }

  async getPartners(
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; partners: IPartnerFormatter[] }> {
    const { PartnerDataAccess } = this;
    const { page = 1, size = 20, status } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);

    const [partners] = await PartnerDataAccess.all({ status }, { offset, limit });

    const meta = paginationMetaData(partners?.metadata[0]?.total, pageNum, offset, size as number);

    return {
      meta,
      partners: partners?.data?.map((partner: Record<string, unknown>) =>
        PartnerFormatter({ partner }),
      ),
    };
  }

  async findPartnerByID(partnerId: string) {
    const { PartnerDataAccess } = this;

    const partner = await PartnerDataAccess.findPartnerById(partnerId);

    if (!partner) {
      throw new BadRequestError('Invalid Partner ID', { code: 'INVALID_PARTNER_ID' });
    }

    return partner;
  }

  async getPartnerById(partnerId: string): Promise<IPartnerFormatter> {
    const { PartnerDataAccess } = this;

    const partner = await PartnerDataAccess.findPartnerById(partnerId);

    return PartnerFormatter({ partner });
  }

  async invite(payload: InvitePartnerInput) {
    const { PartnerDataAccess, NotificationProvider, config } = this;

    const {
      partnerName: name,
      email,
      states,
      address,
      countryCode,
      phoneNumber,
      cacNumber,
      directorNin,
      settings,
    } = payload;

    const { verificationToken, expiryTime } = getVerificationCodeAndExpiry(60);

    const data = await PartnerDataAccess.invitePartner(
      {
        name,
        email,
        states,
        address,
        cacNumber,
        countryCode,
        directorNin,
        phoneNumber,
        settings,
      },
      {
        inviteToken: verificationToken,
        inviteTokenExpiry: expiryTime,
      },
    );

    const emailContent = await invitePartnerEmailContent({
      name,
      url: `${config.get('frontend.partnerUrl')}/complete-registration?token=${verificationToken}`,
    });

    await NotificationProvider.email.send({
      email,
      subject: `Partner - ${name} Invite`,
      content: emailContent,
    });

    return data;
  }

  async reInvite(payload: ReInvitePartnerInput): Promise<string> {
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

    const emailContent = await invitePartnerEmailContent({
      name: invite?.requestPayload?.name,
      url: `https://firstcheck.com/partner`,
    });

    await NotificationProvider.email.send({
      email,
      subject: 'Partner Invite',
      content: emailContent,
    });

    return 'Invite Resent Successfully';
  }

  async completeInviteSignup(payload: CompleteInviteSignupInput) {
    const { PartnerDataAccess, NotificationProvider, RoleDataAccess } = this;

    const { firstName, lastName, email, phoneNumber, inviteToken, password } = payload;

    const role = await RoleDataAccess.getPartnerSuperAdminRole();

    if (!role) {
      throw new BadRequestError('Invalid default role', { code: 'INVALID_DEFAULT_ROLE' });
    }

    await PartnerDataAccess.completePartnerSignup({
      firstName,
      lastName,
      email,
      phoneNumber,
      inviteToken,
      password,
      role: role._id,
    });

    const emailContent = await createPartnerUserEmailContent({
      firstName,
      lastName,
      url: `https://firstcheck.com/partner`,
    });

    await NotificationProvider.email.send({
      email,
      subject: 'Partner Invite',
      content: emailContent,
    });

    return 'Account Created Successfully';
  }

  async updatePartnerById(partnerId: string, payload: UpdatePartnerInput): Promise<string> {
    const { PartnerDataAccess } = this;

    const partner = await this.findPartnerByID(partnerId);

    await PartnerDataAccess.updatePartnerById(partnerId, {
      ...(payload?.email ? { email: payload.email } : undefined),
      ...(payload?.active ? { status: payload.active } : undefined),
      ...(payload?.states ? { states: payload.states } : undefined),
      ...(payload?.address ? { address: payload.address } : undefined),
      ...(payload?.settings ? { settings: payload.settings } : undefined),
      ...(payload?.partnerName ? { name: payload.partnerName } : undefined),
      ...(payload?.phoneNumber ? { phoneNumber: payload.phoneNumber } : undefined),
      ...(payload?.prices?.address?.partner
        ? {
            'prices.address.partner': {
              ...partner.prices.address.partner,
              lagos: payload?.prices?.address?.partner?.lagos,
              others: payload?.prices?.address?.partner?.others,
            },
          }
        : undefined),
      ...(payload?.prices?.address?.agent
        ? {
            'prices.address.agent': {
              ...partner.prices.address.agent,
              lagos: payload?.prices?.address?.agent?.lagos,
              others: payload?.prices?.address?.agent?.others,
            },
          }
        : undefined),
    });

    return 'Partner Updated Successfully';
  }

  async invitePartnerUser(payload: InvitePartnerUserInput): Promise<string> {
    const { UserDataAccess, PartnerDataAccess, NotificationProvider } = this;

    const partner = await this.getPartnerById(payload.partnerId);

    const password = generatePassword.generate({
      length: 12,
      numbers: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const user = await UserDataAccess.createUserAccount({
      ...payload,
      email: payload?.email?.toLowerCase(),
      password,
      userType: UserType.PARTNER,
      mustChangePassword: true,
      isPhoneNumberVerified: true,
      isEmailVerified: false,
      country: {
        code: partner?.country?.code,
        name: COUNTRY_CODES_NAMES_LOOKUP.get(partner?.country?.code),
      },
    });

    if (!user) {
      throw new InternalError('Something went wrong create business account');
    }

    await PartnerDataAccess.pushAdminUsers(partner._id, {
      users: {
        user: user?._id,
        role: payload.role,
      },
    });

    await NotificationProvider.email.send({
      email: payload.email,
      subject: `${payload.firstName} account created successfully`,
      content: `An account has been created for you to  join the business ${partner?.name}, default password is <b>${password}</b>`,
    });

    return 'Account Created Successfully';
  }

  async createPartnerUser(payload: InvitePartnerUserInput): Promise<string> {
    const { UserDataAccess, RoleDataAccess, NotificationProvider } = this;

    const partner = await this.findPartnerByID(payload.partnerId);

    const role = await RoleDataAccess.getRoleById(payload.role);

    if (!role) {
      throw new BadRequestError('Invalid Role ID', { code: 'ROLE_NOT_FOUND' });
    }

    const password = generatePassword.generate({
      length: 12,
      numbers: true,
    });

    await UserDataAccess.createPartnerUserAccount({
      ...payload,
      email: payload?.email?.toLowerCase(),
      password,
      userType: UserType.PARTNER,
      mustChangePassword: true,
      isPhoneNumberVerified: true,
      isEmailVerified: false,
      role: payload.role,
      permissions: role.permissions,
      country: {
        code: partner?.countryCode,
        name: COUNTRY_CODES_NAMES_LOOKUP.get(partner?.countryCode),
      },
    });

    await NotificationProvider.email.send({
      email: payload.email,
      subject: `${payload.firstName} account created successfully`,
      content: `An account has been created for you to  join the partner ${partner?.name}, email ${payload.email} default password is <b>${password}</b>`,
    });

    return 'Account Created Successfully';
  }

  async firstTimeChangePassword(payload: FirstTimePartnerUserChangePasswordInput): Promise<string> {
    const { UserDataAccess, PartnerDataAccess, NotificationProvider } = this;

    const { partnerUserId, oldPassword, password } = payload;

    const partner = await PartnerDataAccess.findBusinessByBusinessUserId(partnerUserId);

    const partnerUser = partner?.users.find(
      (user: Record<string, unknown>) => String(user._id) === partnerUserId,
    );

    const user = await UserDataAccess.findUserById(partnerUser?.user);

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
      PartnerDataAccess.updateUserStatus(partner._id, partnerUser._id),
    ]);

    await NotificationProvider.email.send({
      email: user.email,
      subject: `${user.firstName} password changed successfully`,
      content: `Password has been changed successfully, default password is <b>${password}</b>`,
    });

    return 'Account Created Successfully';
  }

  async reAssignTask(payload: ReAssignTaskInput): Promise<string> {
    const { AblyClient, TaskDataAccess, AddressDataAccess, RedisClient, AgentService } = this;

    const { task, agent } = payload;

    const taskData = await TaskDataAccess.fetchTaskByID(task);

    if (!taskData) {
      throw new BadRequestError('Invalid Task ID.', { code: 'TASK_NOT_FOUND' });
    }

    const agentStatus = await RedisClient.hGet(REDIS_LOCATION_KEY.AGENT_ONLINE_STATUS, agent);
    const agentParseObject = JSON.parse(String(agentStatus));

    if (agentParseObject?.status !== AgentOnlineStatus.ONLINE) {
      throw new BadRequestError('Agent Cannot be reached.', { code: 'AGENT_UNREACHABLE' });
    }

    const { address, candidate } = taskData;

    if (!address) {
      throw new BadRequestError('Invalid Task Address.', { code: 'ADDRESS_NOT_FOUND' });
    }

    if (!candidate) {
      throw new BadRequestError('Invalid Task Candidate.', { code: 'CANDIDATE_NOT_FOUND' });
    }

    if (
      [AddressStatusEnum.VERIFIED, AddressStatusEnum.FAILED].includes(address?.status) &&
      !address.isFlagged
    ) {
      throw new BadRequestError('Completed Task cannot be re assigned', {
        code: 'TASK_REASSIGN_FAILED',
      });
    }

    const agents = await AgentService.fetchAgentWithAddressLocation({
      longitude: address?.position?.longitude,
      latitude: address?.position?.latitude,
      state: address?.details?.state,
    });

    const singleAgent = agents.find(
      (agentFilter: Record<string, unknown>) => String(agentFilter.agentId) === String(agent),
    );

    await TaskLogic.assignTaskToAgent(AblyClient, AddressDataAccess, {
      agents: [singleAgent],
      body: {
        verificationId: taskData._id,
        addressId: address?._id,
        landmark: address?.details?.landmark as string,
        candidate: {
          firstName: candidate?.firstName,
          lastName: candidate?.lastName,
          phoneNumber: candidate?.phoneNumber,
        },
        address: address?.formatAddress,
      },
      position: {
        longitude: address?.position.longitude,
        latitude: address?.position.latitude,
      },
    });

    return 'Task assigned successfully';
  }

  async reAssignAllTask(payload: ReAssignTaskAllInput): Promise<string> {
    const { AgentService, AddressDataAccess, AblyClient } = this;

    const { tasks, state } = payload;

    const allAddresses = await AddressDataAccess.fetchTaskForAllReassign({ state, tasks });

    for (const address of allAddresses) {
      const agents = await AgentService.fetchAgentWithAddressLocation({
        latitude: address?.position?.latitude,
        longitude: address?.position?.longitude,
        state: address?.details?.state,
      });

      await TaskLogic.assignTaskToAgent(AblyClient, AddressDataAccess, {
        agents,
        body: {
          verificationId: address.task,
          addressId: address?._id,
          landmark: address?.details?.landmark as string,
          candidate: {
            firstName: address?.candidate?.firstName,
            lastName: address?.candidate?.lastName,
            phoneNumber: address?.candidate?.phoneNumber,
          },
          address: address?.formatAddress,
        },
        position: {
          longitude: address?.position.longitude,
          latitude: address?.position.latitude,
        },
      });
    }

    return 'Task has been broadcast successfully';
  }

  async dashboardMetrics(partnerId: string, query: Record<string, unknown>) {
    const { AddressDataAccess, PartnerDataAccess } = this;

    const [[partner], totalAgents] = await Promise.all([
      AddressDataAccess.partnerDashboardMetrics(partnerId, query),
      PartnerDataAccess.countAllAgents(partnerId),
    ]);

    return {
      totalVerifications: 0,
      totalCompletedVerifications: 0,
      totalVerificationInProgress: 0,
      totalPendingVerification: 0,
      totalUnassignVerification: 0,
      totalAssignedVerification: 0,
      ...partner,
      totalAgents,
    };
  }

  async dashboardTrendings(partnerId: string, limit: string): Promise<IAddressFormatter> {
    const { PartnerDataAccess, AddressDataAccess } = this;

    const partner = await PartnerDataAccess.findPartnerById(partnerId);

    if (!partner) {
      throw new BadRequestError('Invalid Business ID', { code: 'INVALID_BUSINESS_ID' });
    }

    const addresses = await AddressDataAccess.fetchPartnerLimitedVerifications(
      partner._id,
      Number(limit) || 15,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return addresses.map((address: any) =>
      AddressFormatter({
        address: {
          ...address,
          candidate: address.candidate[0],
          agent: address?.agent ? address?.agent[0] : undefined,
        },
      }),
    );
  }

  async partnerVerifications(
    partnerId: string,
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; addresses: IAddressFormatter[] }> {
    const { PartnerDataAccess, AddressDataAccess } = this;

    const {
      page = 1,
      size = 20,
      status: inputStatus,
      type,
      search,
      customStartDate,
      customEndDate,
      phoneNumber,
      email,
      state,
    } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);

    const partner = await PartnerDataAccess.findPartnerById(partnerId);

    if (!partner) {
      throw new BadRequestError('Invalid Partner ID', { code: 'INVALID_PARTNER_ID' });
    }

    const status =
      inputStatus === 'completed'
        ? [AddressStatusEnum.VERIFIED, AddressStatusEnum.FAILED]
        : inputStatus;

    const [addresses] = await AddressDataAccess.allPartnerVerifications(
      partner._id,
      { status, type, search, customStartDate, customEndDate, phoneNumber, email, state },
      { offset, limit },
    );

    const meta = paginationMetaData(addresses?.metadata[0]?.total, pageNum, offset, size as number);

    return {
      meta,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addresses: addresses?.data.map((address: any) =>
        AddressFormatter({
          address: {
            ...address,
            candidate: Array.isArray(address.candidate) ? address.candidate[0] : address.candidate,
            agent: address.agent
              ? Array.isArray(address.agent)
                ? address.agent[0]
                : address.agent
              : undefined,
          },
        }),
      ),
    };
  }

  async partnerVerificationById({
    verificationId,
  }: {
    verificationId: string;
  }): Promise<IAddressFormatter | undefined> {
    const { AddressDataAccess } = this;

    const address = await AddressDataAccess.getPartnerVerification(verificationId);

    if (!address) {
      throw new BadRequestError('Invalid Verification ID', { code: 'INVALID_VERIFICATION_ID' });
    }

    return AddressFormatter({ address });
  }

  async getAvailableAgentsToAddress({ verificationId }: { verificationId: string }) {
    const { AddressDataAccess, AgentDataAccess, AgentService } = this;

    const address = await AddressDataAccess.getPartnerVerification(verificationId);

    if (!address) {
      throw new BadRequestError('Invalid Verification ID', { code: 'INVALID_VERIFICATION_ID' });
    }

    const agents = await AgentService.fetchAgentWithAddressLocation({
      latitude: address?.position?.latitude,
      longitude: address?.position?.longitude,
      state: address?.state,
    });

    const allAgentIds = agents
      .filter(
        (agent: Record<string, unknown>) =>
          agent?.partner?.toString() === address?.partner?.toString(),
      )
      .map((agent: Record<string, unknown>) => agent.agentId);

    const dbAgents = await AgentDataAccess.fetchPopulatedAgentByIds(allAgentIds);

    const results = [];

    for (const redisAgent of agents) {
      for (const dbAgent of dbAgents) {
        if (String(redisAgent.agentId) === String(dbAgent._id)) {
          results.push({
            distance: redisAgent.distance,
            presence: redisAgent.presence,
            agent: {
              id: dbAgent._id,
              imageUrl: dbAgent.imageUrl,
              user: {
                firstName: dbAgent?.user?.firstName,
                lastName: dbAgent?.user?.lastName,
                phoneNumber: dbAgent?.user?.phoneNumber,
              },
            },
          });
        }
      }
    }

    return results;
  }

  async getAgentPerformance({ partnerId, agentId }: { partnerId: string; agentId: string }) {
    const { AddressDataAccess, AgentDataAccess } = this;

    const agent = await AgentDataAccess.findAgentById(agentId);

    if (!agent) {
      throw new BadRequestError('Invalid Agent ID', { code: 'INVALID_AGENT_ID' });
    }

    const [performance] = await AddressDataAccess.getAgentPerformance(partnerId, agentId);

    return {
      totalVerifications: 0,
      totalCompletedVerifications: 0,
      totalPendingVerification: 0,
      outstanding: agent?.wallet?.outstandingPayment,
      withdrawableAmount: agent?.wallet?.withdrawableAmount,
      totalPaid: agent?.wallet?.totalPaid,
      completionRate:
        Math.ceil(
          Number(
            ((performance?.totalCompletedVerifications || 0) /
              (performance?.totalVerifications || 0)) *
              100,
          ),
        ) || 100,
      ...performance,
    };
  }

  async partnerAgents(
    partnerId: string,
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; agents: IAgentFormatter[] }> {
    const { AgentDataAccess, RedisClient } = this;

    const {
      page = 1,
      size = 20,
      status,
      period,
      type,
      search,
      customStartDate,
      customEndDate,
      email,
      state,
      // customEndDate = new Date(),
      // customStartDate = startOfDay(subDays(new Date(), 30)),
    } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);

    const [agents] = await AgentDataAccess.partnerAgents(
      partnerId,
      { status, period, type, search, email, customStartDate, customEndDate, state },
      { offset, limit },
    );

    const meta = paginationMetaData(agents?.metadata[0]?.total, pageNum, offset, size as number);

    const mappedAgents = await agents?.data.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (acc: any, agent: Record<string, unknown>) => {
        acc = await acc;

        const agentStatus = await RedisClient.hGet(
          REDIS_LOCATION_KEY.AGENT_ONLINE_STATUS,
          String(agent?._id),
        );
        const agentParseObject = JSON.parse(String(agentStatus));

        acc.push({
          ...agent,
          realtimeStatus: agentParseObject?.status || AgentOnlineStatus.OFFLINE,
        });

        return acc;
      },
      [],
    );

    return {
      meta,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      agents: mappedAgents.map((agent: any) => AgentFormatter({ agent })),
    };
  }

  async partnerAgentById({ agentId }: { agentId: string }): Promise<IAgentFormatter | undefined> {
    const { AgentDataAccess, RedisClient } = this;

    const agent = await AgentDataAccess.findAgentById(agentId);

    if (!agent) {
      throw new BadRequestError('Invalid Agent ID', { code: 'INVALID_AGENT_ID' });
    }

    const agentStatus = await RedisClient.hGet(REDIS_LOCATION_KEY.AGENT_ONLINE_STATUS, agentId);
    const agentParseObject = JSON.parse(String(agentStatus));

    agent.realtimeStatus = agentParseObject?.status;

    return AgentFormatter({ agent });
  }

  async partnerAgentVerifications(
    { agentId }: { agentId: string },
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; addresses: IAddressFormatter[] }> {
    const { AddressDataAccess } = this;

    const {
      page = 1,
      size = 20,
      status: inputStatus,
      type,
      search,
      customStartDate,
      customEndDate,
    } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);

    const status =
      inputStatus === 'completed'
        ? [AddressStatusEnum.VERIFIED, AddressStatusEnum.FAILED]
        : inputStatus;

    const [addresses] = await AddressDataAccess.allAgentVerifications(
      agentId,
      { status, type, search, customStartDate, customEndDate },
      { offset, limit },
    );

    const meta = paginationMetaData(addresses?.metadata[0]?.total, pageNum, offset, size as number);

    return {
      meta,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addresses: addresses?.data.map((address: any) =>
        AddressFormatter({
          address: {
            ...address,
            candidate: address.candidate[0],
            agent: address.agent ? address.agent[0] : undefined,
          },
        }),
      ),
    };
  }

  // async updatePartnerAgent(payload: UpdatePartnerAgentInput): Promise<string> {
  //   const { PartnerDataAccess } = this;

  //   // await PartnerDataAccess.updatePartnerById(payload);

  //   return 'Partner Updated Successfully';
  // }

  async changePassword(payload: ChangePasswordInput): Promise<string> {
    const { UserDataAccess } = this;

    const { userId, oldPassword, password } = payload;

    const userData = await UserDataAccess.findUserAuthById(userId);

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

  async getPartnerUserByID(params: {
    partnerId: string;
    userId: string;
  }): Promise<IPartnerUserFormatter> {
    const partner = await this.findPartnerByID(params.partnerId);

    const partnerUser = partner?.users.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (partnerUser: any) => String(partnerUser?.user?._id) === params.userId,
    );

    if (!partnerUser) {
      throw new BadRequestError('Invalid Business User Profile', { code: 'INVALID_BUSINESS_USER' });
    }

    return PartnerUserFormatter({ partnerUser });
  }

  async partnerUsers(partnerId: string): Promise<IPartnerUserFormatter[]> {
    const partner = await this.findPartnerByID(partnerId);

    return partner?.users.map((user: Record<string, unknown>) =>
      PartnerUserFormatter({ partnerUser: user }),
    );
  }

  async attachRole(payload: AttachRolesInput): Promise<string> {
    const { PartnerDataAccess, RoleDataAccess, RedisClient } = this;

    const { partner, user, role } = payload;

    const partnerData = await this.findPartnerByID(partner);

    if (!partnerData) {
      throw new BadRequestError('Invalid Partner ID', { code: 'PARTNER_NOT_FOUND' });
    }

    const partnerUser = partnerData.users.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (userItem: any) => String(userItem.user?._id) === user || String(partnerData.user) === user,
    );

    if (!partnerUser) {
      throw new BadRequestError('Invalid Partner User ID', { code: 'PARTNER_USER_NOT_FOUND' });
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

    await PartnerDataAccess.updatePartnerUserRole(partner, user, role);

    return 'Role Changed Successfully';
  }

  async getPartnerRoles(partnerId: string): Promise<IRoleFormatter> {
    const { RoleDataAccess } = this;

    const partner = await this.findPartnerByID(partnerId);

    const roles = await RoleDataAccess.allPartnerRoles(partner._id);

    return roles.map((role: Record<string, unknown>) => RoleFormatter({ role }));
  }

  async suspendPartnerUser(payload: SuspendUserInput): Promise<string> {
    const { PartnerDataAccess } = this;

    const partner = await this.findPartnerByID(payload.partner);

    await PartnerDataAccess.suspendPartnerUser(partner._id, payload.user);

    return 'User Suspended Successfully';
  }

  async restorePartnerUser(payload: SuspendUserInput): Promise<string> {
    const { PartnerDataAccess } = this;

    const partner = await this.findPartnerByID(payload.partner);

    await PartnerDataAccess.restorePartnerUser(partner._id, payload.user);

    return 'User Restored Successfully';
  }

  async suspendPartnerAgent(payload: SuspendAgentInput): Promise<string> {
    const { AgentDataAccess } = this;

    await this.findPartnerByID(payload.partner);

    await AgentDataAccess.suspendPartnerAgent(payload.agent);

    return 'Agent Suspended Successfully';
  }

  async restorePartnerAgent(payload: SuspendAgentInput): Promise<string> {
    const { AgentDataAccess } = this;

    await this.findPartnerByID(payload.partner);

    await AgentDataAccess.restorePartnerAgent(payload.agent);

    return 'Agent Restored Successfully';
  }

  async agentLastLocation(
    agentId: string,
  ): Promise<{ position: { longitude: string; latitude: string }; status: string }> {
    const { RedisClient } = this;

    const agentStatus = await RedisClient.hGet(REDIS_LOCATION_KEY.AGENT_ONLINE_STATUS, agentId);
    const agentParseObject = JSON.parse(String(agentStatus));

    return {
      position: {
        longitude: agentParseObject?.longitude,
        latitude: agentParseObject?.latitude,
      },
      status: agentParseObject?.status,
    };
  }

  async unflaggedVerification(payload: UnflaggedVerificationInput) {
    const { TaskDataAccess, AddressDataAccess, NotificationProvider } = this;
    const { task, user } = payload;

    const taskData = await TaskDataAccess.fetchTaskByID(task);

    if (!taskData) {
      throw new BadRequestError('Invalid Task ID.', { code: 'TASK_NOT_FOUND' });
    }

    const { address, candidate } = taskData;

    if (!address) {
      throw new BadRequestError('Invalid Task Address.', { code: 'ADDRESS_NOT_FOUND' });
    }

    if (!candidate) {
      throw new BadRequestError('Invalid Task Candidate.', { code: 'CANDIDATE_NOT_FOUND' });
    }

    if (!address.isFlagged) {
      throw new BadRequestError('Address was not flagged.', { code: 'ADDRESS_NOT_FLAGGED' });
    }

    await AddressDataAccess.updateAddressByIdTransaction(address._id, {
      isFlagged: false,
      flaggedDetails: {
        ...address?.flaggedDetails,
        unflaggedAt: new Date(),
        unflaggedBy: user,
      },
    });

    const emailContent = await unflaggedAddressEmailContent({
      address: address?.formatAddress,
      taskId: taskData?._id,
    });

    await NotificationProvider.email.send({
      email: taskData?.business?.email,
      subject: `You address with task id ${taskData?._id} has been unflagged`,
      content: emailContent,
    });

    if (taskData?.business?.api?.webhook) {
      EventEmitterBroker.emit('sendTaskStatusUpdate', {
        url: taskData?.business?.api?.webhook,
        task,
      });
    }

    return 'Address Unflagged Successfully';
  }

  async partnerWithdrawals(
    partnerId: string,
    query: Record<string, unknown>,
  ): Promise<{
    meta: Record<string, unknown>;
    transactions: IPartnerWithdrawalFormatter[];
  }> {
    const { PartnerTransactionDataAccess } = this;
    const { page = 1, size = 20, period, type, status, customStartDate, customEndDate } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);

    const [withdrawals] = await PartnerTransactionDataAccess.allPartnerWithdrawals(
      partnerId,
      {
        period,
        status,
        type,
        customStartDate,
        customEndDate,
      },
      {
        offset,
        limit,
      },
    );

    const meta = paginationMetaData(
      withdrawals?.metadata[0]?.total,
      pageNum,
      offset,
      size as number,
    );

    return {
      meta,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transactions: withdrawals?.data?.map((withdrawal: any) =>
        PartnerWithdrawalFormatter({
          withdrawal: {
            ...withdrawal,
            partner: withdrawal?.partner[0],
          },
        }),
      ),
    };
  }

  async withdrawFund(payload: WithdrawPartnerFundInput): Promise<string> {
    const { PaystackProvider, PartnerTransactionDataAccess, PartnerDataAccess } = this;
    const { amount, partner: partnerId } = payload;

    const partner = await this.findPartnerByID(partnerId);

    if (amount > (partner?.wallet?.withdrawableAmount || 0)) {
      throw new BadRequestError('Amount Exceed Withdrawable Balance', {
        code: 'AMOUNT_EXCEED_WITHDRAWABLE',
      });
    }

    const reference = generateUniqueReference('transfer');

    const transfer = await PaystackProvider.transfer({
      reason: `Partner ${partner?.firstName} - Withdrawal`,
      amount: Number(amount * 100),
      recipientCode: partner?.bank?.recipientCode,
      reference,
    });

    await Promise.all([
      PartnerDataAccess.updatePartnerById(partner._id, {
        wallet: {
          ...partner?.wallet,
          withdrawableAmount: Number((partner?.wallet?.withdrawableAmount || 0) - amount),
        },
      }),
      PartnerTransactionDataAccess.create({
        partner: partner._id,
        amount,
        transferCode: transfer.transferCode,
        paidAt: new Date(),
        accountNumber: partner?.bank?.accountNumber,
        bankName: partner?.bank?.bankName,
        reference,
        type: PaymentTypeEnum.WITHDRAWAL,
      }),
    ]);

    return 'Request Recieved, amount will be debited into your account';
  }

  async upsertBank(payload: UpsertBankInput): Promise<string> {
    const { PaystackProvider, PartnerDataAccess } = this;

    const { partner: partnerId, accountNumber, bankCode } = payload;

    const partner = await this.findPartnerByID(partnerId);

    const bankDetails = await PaystackProvider.createTransferRecipient({
      accountNumber,
      bankCode,
    });

    await PartnerDataAccess.updatePartnerById(partner._id, {
      bank: {
        bankName: bankDetails?.bankName,
        accountNumber: bankDetails?.accountNumber,
        accountName: bankDetails?.accountName,
        recipientCode: bankDetails?.recipientCode,
      },
    });

    return 'Bank has been added';
  }
}
