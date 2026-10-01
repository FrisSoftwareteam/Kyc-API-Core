import generatePassword from 'generate-password';
import CommonLogic from '../logics/common.logic';
import { REDIS_LOCATION_KEY, ADDRESS_PRICES, NotificationModelTypeEnum } from '../constants';
import EventEmitterBroker from '../events';
import { BadRequestError, AuthFailureError } from '../errors/api.error';
import { StatusEnum, EntityEnum } from '../models/types/task.type';
import {
  unflaggedAddressEmailContent,
  notifyPartnerAssignTask,
  notifyPartnerAssignBulkTask,
  rejectAddressEmailContent,
  bulkVerificationExportEmailContent,
  consumerVerificationApprovedContent,
  consumerVerificationDeclinedContent,
  invitAdminEmailContent,
  submitOtherTaskResponse,
} from '../utils/email';
import { AdminApprovalStatusEnum, AddressStatusEnum } from '../models/types/address.type';
import { AgentOnlineStatus } from '../models/types/agent.type';
import TaskFormatter, { ITaskFormatter } from '../formatters/task.formatter';
import PartnerFormatter, { IPartnerFormatter } from '../formatters/partner.formatter';
import ServiceFormatter, { IServiceFormatter } from '../formatters/service.formatter';
import AddressFormatter, { IAddressFormatter } from '../formatters/address.formatter';
import UserFormatter, { IUserFormatter } from '../formatters/user.formatter';
import RoleFormatter, { IRoleFormatter } from '../formatters/role.formatter';
import {
  SuspendUserInput,
  RestoreUserInput,
  AttachRolesInput,
  CreateAdminInput,
  DisablePartnerInput,
  ApproveAddressInput,
  DisableBusinessInput,
  SendTaskToVerifierInput,
  RejectVerificationInput,
  FundBusinessAccountInput,
  ChangeAdminPasswordInput,
  UpdateAddressPartnerInput,
  UnflaggedVerificationInput,
  CreateBusinessServiceInput,
  AttachPartnerToAddressesInput,
  ApproveOtherVerificationInput,
  ApproveCustomerVerificationInput,
  SubmitVerifierVerificationTaskInput,
} from '../schemas/admin.schema';
import TaskLogic from '../logics/task.logic';
import { distanceBetweenPoints, generateUniqueReference } from '../utils/helper';
import { PaymentTypeEnum, PaymentStatusEnum } from '../models/types/agent-transaction.type';
import { paginationReqData, paginationMetaData } from '../utils/helper';
import {
  PaymentTypeEnum as TransactionTypeEnum,
  PaymentStatusEnum as TransactionStatusEnum,
  PaymentProviderEnum,
} from '../models/types/transaction.type';

export default class AdminService {
  private readonly config;
  private readonly logger;
  private readonly AblyClient;
  private readonly RedisClient;
  private readonly AgentService;
  private readonly TaskDataAccess;
  private readonly UserDataAccess;
  private readonly RoleDataAccess;
  private readonly AdminDataAccess;
  private readonly AgentDataAccess;
  private readonly PaystackProvider;
  private readonly AddressDataAccess;
  private readonly ServiceDataAccess;
  private readonly PartnerDataAccess;
  private readonly BusinessDataAccess;
  private readonly NotificationProvider;
  private readonly TransactionDataAccess;
  private readonly NotificationDataAccess;
  private readonly BusinessServiceDataAccess;
  private readonly AgentTransactionDataAccess;
  private readonly BusinessCandidateDataAccess;
  private readonly PartnerTransactionDataAccess;

  constructor({
    config,
    logger,
    AblyClient,
    RedisClient,
    AgentService,
    TaskDataAccess,
    UserDataAccess,
    RoleDataAccess,
    AgentDataAccess,
    AdminDataAccess,
    PaystackProvider,
    AddressDataAccess,
    ServiceDataAccess,
    PartnerDataAccess,
    BusinessDataAccess,
    NotificationProvider,
    TransactionDataAccess,
    NotificationDataAccess,
    BusinessServiceDataAccess,
    AgentTransactionDataAccess,
    BusinessCandidateDataAccess,
    PartnerTransactionDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.logger = logger;
    this.AblyClient = AblyClient;
    this.RedisClient = RedisClient;
    this.AgentService = AgentService;
    this.TaskDataAccess = TaskDataAccess;
    this.UserDataAccess = UserDataAccess;
    this.RoleDataAccess = RoleDataAccess;
    this.AdminDataAccess = AdminDataAccess;
    this.AgentDataAccess = AgentDataAccess;
    this.PaystackProvider = PaystackProvider;
    this.AddressDataAccess = AddressDataAccess;
    this.ServiceDataAccess = ServiceDataAccess;
    this.PartnerDataAccess = PartnerDataAccess;
    this.BusinessDataAccess = BusinessDataAccess;
    this.NotificationProvider = NotificationProvider;
    this.TransactionDataAccess = TransactionDataAccess;
    this.NotificationDataAccess = NotificationDataAccess;
    this.BusinessServiceDataAccess = BusinessServiceDataAccess;
    this.AgentTransactionDataAccess = AgentTransactionDataAccess;
    this.BusinessCandidateDataAccess = BusinessCandidateDataAccess;
    this.PartnerTransactionDataAccess = PartnerTransactionDataAccess;
  }

  async createAdmin(payload: CreateAdminInput) {
    const { AdminDataAccess, RoleDataAccess, NotificationProvider } = this;

    const password = generatePassword.generate({
      length: 12,
      numbers: true,
    });

    const role = await RoleDataAccess.getRoleById(payload.role);

    if (!role) {
      throw new BadRequestError('Invalid Role ID', { code: 'ROLE_NOT_FOUND' });
    }

    await AdminDataAccess.createAdmin({
      ...payload,
      password,
      permissions: role.permissions,
    });

    const emailContent = await invitAdminEmailContent({
      email: payload?.email,
      password,
    });

    await NotificationProvider.email.send({
      email: payload?.email,
      subject: 'You have been invited to firstcheck admin',
      content: emailContent,
    });

    return 'Account Created Successfully';
  }

  async dashboardMetrics(query: Record<string, unknown>) {
    const { TaskDataAccess, PartnerDataAccess, BusinessDataAccess, AgentDataAccess } = this;

    const [[verifications], totalPartners, totalBusinesses, totalAgents] = await Promise.all([
      TaskDataAccess.adminDashboardMetrics(query),
      PartnerDataAccess.countAllPartners(query),
      BusinessDataAccess.countAllBusinesses(query),
      AgentDataAccess.countAllAgents(query),
    ]);

    return {
      totalVerifications: verifications?.totalVerifications ?? 0,
      totalBusinesses: totalBusinesses ?? 0,
      totalPartners: totalPartners ?? 0,
      totalAgents: totalAgents ?? 0,
      completed: Number(
        ((verifications?.totalCompleted ?? 0) / (verifications?.totalVerifications || 0)) * 100,
      ).toFixed(2),
      revenue: verifications?.revenue ?? 0,
    };
  }

  async adminProfile(
    adminId: string,
  ): Promise<IUserFormatter & { permissions: string[]; role: { [key: string]: string } }> {
    const { AdminDataAccess } = this;

    const user = await AdminDataAccess.findUserAdminById(adminId);

    return {
      ...UserFormatter({ user: user?.user }),
      permissions: user?.permissions,
      role: user?.role,
    };
  }

  async businessMetrics(businessId: string) {
    const { TaskDataAccess, BusinessCandidateDataAccess, TransactionDataAccess } = this;

    const [totalCandidate, totalVerifications, totalPayments] = await Promise.all([
      BusinessCandidateDataAccess.countBusinessCandidates(businessId),
      TaskDataAccess.countAllBusinessVerifications(businessId),
      TransactionDataAccess.sumAllVerifications(businessId),
      // AgentDataAccess.countAllAgents(query),
    ]);

    return {
      totalCandidates: totalCandidate ?? 0,
      totalVerifications: totalVerifications ?? 0,
      totalPayments: totalPayments[0]?.sum ?? 0,
    };
  }

  async partnerMetrics(partnerId: string) {
    const { AddressDataAccess, PartnerDataAccess } = this;

    const [[partner], totalAgents] = await Promise.all([
      AddressDataAccess.partnerDashboardMetrics(partnerId, {}),
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

  async businessServices(businessId: string): Promise<IServiceFormatter[]> {
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

  async dashboardTrendings(query: Record<string, unknown>): Promise<ITaskFormatter[]> {
    const { TaskDataAccess } = this;

    const tasks = await TaskDataAccess.fetchLimitedAdminVerifications(Number(query?.limit) || 15);

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

  async verificationMetrics(query: Record<string, unknown>) {
    const { AddressDataAccess } = this;

    const [partner] = await AddressDataAccess.adminVerificationMetrics(query);

    return {
      totalVerifications: 0,
      totalCompletedVerifications: 0,
      totalVerificationInProgress: 0,
      totalPendingVerification: 0,
      totalUnassignVerification: 0,
      totalAssignedVerification: 0,
      ...partner,
    };
  }

  async verifications(
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; tasks: ITaskFormatter[] }> {
    const { TaskDataAccess } = this;

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

    const [tasks] = await TaskDataAccess.allAdminVerifications(
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
            // certificateDocument: task.certificateDocument[0],
          },
        }),
      ),
    };
  }

  async otherVerifications(
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; tasks: ITaskFormatter[] }> {
    const { TaskDataAccess } = this;

    const {
      type,
      status,
      period,
      entity,
      search,
      page = 1,
      size = 20,
      customEndDate,
      customStartDate,
    } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);

    const [tasks] = await TaskDataAccess.allAdminOtherVerifications(
      { status, period, type, entity, search, customStartDate, customEndDate },
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
            // certificateDocument: task.certificateDocument[0],
          },
        }),
      ),
    };
  }

  async exportVerifications(query: Record<string, unknown>): Promise<boolean> {
    const { TaskDataAccess, UserDataAccess, NotificationProvider, logger } = this;

    const { status, period, type, search, customStartDate, customEndDate, userId, businessId } =
      query;

    const user = await UserDataAccess.findUserById(userId);

    if (!user) {
      logger.info('[AdminVerificationExport] User ID not found');
      return false;
    }
    const tasks = await TaskDataAccess.exportAdminVerifications({
      status,
      period,
      type,
      search,
      customStartDate,
      customEndDate,
      businessId,
    });

    const data = await CommonLogic.prepareVerificationCsvData(tasks);

    const dataBuffer = await CommonLogic.writeDataToCsvReturnBuffer(data);

    const emailContent = await bulkVerificationExportEmailContent({
      name: `${user?.firstName} ${user?.lastName}`,
      email: user?.email,
    });

    NotificationProvider.email.send({
      email: user?.email,
      content: emailContent,
      subject: 'Bulk Verification Export',
      attachments: [
        {
          filename: `verification-attachment-${Date.now()}.csv`,
          content: dataBuffer,
        },
      ],
    });

    return true;
  }

  async verificationAddresses(
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; addresses: IAddressFormatter[] }> {
    const { AddressDataAccess } = this;

    const {
      page = 1,
      size = 20,
      period,
      type,
      search,
      customStartDate,
      customEndDate,
      tat,
    } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);
    let reviewStatus, underTat;
    let status = query.status;

    if (['pending-review', 'reviewed'].includes(String(query.status))) {
      reviewStatus =
        status === 'reviewed'
          ? [AdminApprovalStatusEnum.APPROVED, AdminApprovalStatusEnum.DECLINED]
          : [AdminApprovalStatusEnum.REVIEW];
      status = undefined;
    }

    if (['under-tat', 'over-tat'].includes(String(query.status))) {
      underTat = status === 'under-tat' ? 'yes' : 'no';

      status = undefined;
    }

    const [addresses] = await AddressDataAccess.allAdminVerifications(
      {
        status,
        period,
        type,
        search,
        customStartDate,
        customEndDate,
        reviewStatus,
        tat,
        underTat,
      },
      { offset, limit },
    );

    const meta = paginationMetaData(addresses?.metadata[0]?.total, pageNum, offset, size as number);

    return {
      meta,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addresses: addresses?.data.map((address: any) => AddressFormatter({ address })),
    };
  }

  async verificationOthers(
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; verifications: ITaskFormatter[] }> {
    const { TaskDataAccess } = this;

    const {
      page = 1,
      size = 20,
      period,
      type,
      search,
      customStartDate,
      customEndDate,
      tat,
    } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);
    let reviewStatus, underTat;
    let status = query.status;

    if (['pending-review', 'reviewed'].includes(String(query.status))) {
      reviewStatus =
        status === 'reviewed'
          ? [AdminApprovalStatusEnum.APPROVED, AdminApprovalStatusEnum.DECLINED]
          : [AdminApprovalStatusEnum.REVIEW];
      status = undefined;
    }

    if (['under-tat', 'over-tat'].includes(String(query.status))) {
      underTat = status === 'under-tat' ? 'yes' : 'no';

      status = undefined;
    }

    const [verifications] = await TaskDataAccess.allOtherVerifications(
      {
        status,
        period,
        type,
        search,
        customStartDate,
        customEndDate,
        reviewStatus,
        tat,
        underTat,
      },
      { offset, limit },
    );

    const meta = paginationMetaData(
      verifications?.metadata[0]?.total,
      pageNum,
      offset,
      size as number,
    );

    return {
      meta,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      verifications: verifications?.data.map((task: any) => TaskFormatter({ task })),
    };
  }

  async adminVerificationById({
    verificationId,
  }: Record<string, unknown>): Promise<ITaskFormatter | undefined> {
    const { TaskDataAccess } = this;

    const task = await TaskDataAccess.fetchTaskByID(verificationId);

    if (!task) {
      throw new BadRequestError('Invalid Task ID', { code: 'TASK_NOT_FOUND' });
    }

    return TaskFormatter({ task });
  }

  async getAddressByAddressId(addressId: string): Promise<IAddressFormatter | undefined> {
    const { AddressDataAccess } = this;

    const address = await AddressDataAccess.findAllDataAddressById(addressId);

    if (!address) {
      throw new BadRequestError('Invalid Address ID', { code: 'ADDRESS_NOT_FOUND' });
    }

    return AddressFormatter({ address });
  }

  async approvedAddress(payload: ApproveAddressInput): Promise<string> {
    const { AddressDataAccess, AgentDataAccess, NotificationDataAccess, UserDataAccess } = this;

    const [user, address] = await Promise.all([
      UserDataAccess.findUserById(payload.admin),
      AddressDataAccess.findAddressById(payload.address),
    ]);

    if (!user) {
      throw new BadRequestError('Admin account not found', { code: 'ADMIN_NOT_FOUND' });
    }

    if (!address) {
      throw new BadRequestError('Invalid Address ID', { code: 'ADDRESS_NOT_FOUND' });
    }

    if (address.isFlagged) {
      throw new BadRequestError('Address is flagged, unflagged to approve', {
        code: 'FLAGGED_ADDRESS',
      });
    }

    if (![AdminApprovalStatusEnum.REVIEW].includes(address?.approver?.status)) {
      return 'Address has been Approved Before';
    }

    if (![AddressStatusEnum.VERIFIED, AddressStatusEnum.FAILED].includes(address.status)) {
      throw new BadRequestError('Address has not been completed by agent', {
        code: 'ADDRESS_NOT_COMPLETED',
      });
    }

    const agent = await AgentDataAccess.findAgentById(address.agent);

    if (!agent) {
      throw new BadRequestError('Invalid Agent ID', { code: 'AGENT_NOT_FOUND' });
    }

    const { partner } = agent;

    if (![AdminApprovalStatusEnum.APPROVED].includes(payload.status as AdminApprovalStatusEnum)) {
      return 'Invalid Status';
    }

    if (payload.status === AdminApprovalStatusEnum.DECLINED) {
      await Promise.all([
        this.updateAddressdeclinedStatus(address, AddressStatusEnum.INPROGRESS, payload),
        NotificationDataAccess.create({
          actor: payload.admin,
          title: `Task ${address?.task} has been Declined`,
          text: `Task ${address?.task} has been Declined`,
          modelId: partner?._id,
          modelType: NotificationModelTypeEnum.PARTNER,
          isRead: false,
        }),
        NotificationDataAccess.create({
          actor: payload.admin,
          title: `Task ${address?.task} was declined by ${user?.firstName} ${user?.lastName}`,
          text: `Task ${address?.task} was declined by ${user?.firstName} ${user?.lastName}`,
          modelType: NotificationModelTypeEnum.ADMIN,
          isRead: false,
        }),
      ]);

      return 'Address has been declined successfully';
    }

    const allTaskCompleted = await CommonLogic.allTaskCompleted(address?.task);

    await Promise.all([
      this.updateAddressAdminStatus(address, payload),
      this.updateTaskStatus(allTaskCompleted, address.task),
      this.updateAgentWallet(partner, address, agent),
      this.updatePartnerWallet(partner, address),
      NotificationDataAccess.create({
        actor: payload.admin,
        title: `Task ${address?.task} has been approved`,
        text: `Task ${address?.task} has been approved`,
        modelId: address?.business,
        modelType: NotificationModelTypeEnum.BUSINESS,
        isRead: false,
      }),
      NotificationDataAccess.create({
        actor: payload.admin,
        title: `Task ${address?.task} was approved by ${user?.firstName} ${user?.lastName}`,
        text: `Task ${address?.task} was approved by ${user?.firstName} ${user?.lastName}`,
        modelType: NotificationModelTypeEnum.ADMIN,
        isRead: false,
      }),
    ]);

    return 'Address Approved Successfully';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateAgentWallet(partner: any, addressData: any, agent: any) {
    const { AgentDataAccess, AgentTransactionDataAccess } = this;
    const addressPrices = partner?.prices?.address?.agent;

    const amount = ['lagos', 'lagos state'].includes(addressData?.details?.state?.toLowerCase())
      ? addressPrices?.lagos || ADDRESS_PRICES.AGENT.lagos
      : addressPrices?.others || ADDRESS_PRICES.AGENT.others;

    Promise.all([
      AgentDataAccess.updateAgentById(agent._id, {
        wallet: {
          ...agent?.wallet,
          outstandingPayment: Number((agent?.wallet?.outstandingPayment || 0) + amount),
          ...(!addressData?.isFlagged
            ? {
                withdrawableAmount: Number((agent?.wallet?.withdrawableAmount || 0) + amount),
              }
            : undefined),
        },
      }),
      AgentTransactionDataAccess.updateOneTransaction(
        {
          agent: agent._id,
          task: addressData.task,
          type: PaymentTypeEnum.PAYMENT,
        },
        {
          status: addressData?.isFlagged ? PaymentStatusEnum.PENDING : PaymentStatusEnum.SUCCESSFUL,
        },
      ),
    ]);

    return true;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updatePartnerWallet(partner: any, addressData: any) {
    const { PartnerDataAccess, PartnerTransactionDataAccess } = this;
    const addressPrices = partner?.prices?.address?.partner;

    const amount = ['lagos', 'lagos state'].includes(addressData?.details?.state?.toLowerCase())
      ? addressPrices?.lagos || ADDRESS_PRICES.PARTNER.lagos
      : addressPrices?.others || ADDRESS_PRICES.PARTNER.others;

    Promise.all([
      PartnerDataAccess.updatePartnerById(partner._id, {
        wallet: {
          ...partner?.wallet,
          outstandingPayment: Number((partner?.wallet?.outstandingPayment || 0) + amount),
          ...(!addressData?.isFlagged
            ? {
                withdrawableAmount: Number((partner?.wallet?.withdrawableAmount || 0) + amount),
              }
            : undefined),
        },
      }),
      PartnerTransactionDataAccess.updateOneTransaction(
        {
          partner: partner._id,
          task: addressData.task,
          type: PaymentTypeEnum.PAYMENT,
        },
        {
          status: addressData?.isFlagged ? PaymentStatusEnum.PENDING : PaymentStatusEnum.SUCCESSFUL,
        },
      ),
    ]);

    return true;
  }

  async updateTaskStatus(allTaskCompleted: boolean, taskId: string) {
    if (!allTaskCompleted) {
      return 'update not done';
    }

    const { TaskDataAccess } = this;

    TaskDataAccess.updateTaskById(taskId, {
      completedAt: new Date(),
      status: StatusEnum.COMPLETED,
    });

    return 'success';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateAddressAdminStatus(address: any, payload: ApproveAddressInput) {
    const { AddressDataAccess } = this;

    AddressDataAccess.updateAddressById(address?._id, {
      approver: {
        ...address?.approver,
        user: payload?.admin,
        status: payload?.status,
      },
    });

    return 'success';
  }

  async updateAddressdeclinedStatus(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    address: any,
    status: AddressStatusEnum,
    payload: ApproveAddressInput,
  ) {
    const { AddressDataAccess } = this;

    AddressDataAccess.updateAddressById(address?._id, {
      status,
      approver: {
        ...address?.approver,
        user: payload?.admin,
        status: payload?.status,
      },
    });

    return 'success';
  }

  async upsertBusinessServices(payload: CreateBusinessServiceInput) {
    const { BusinessDataAccess, BusinessServiceDataAccess } = this;

    const business = await BusinessDataAccess.findBusinessById(payload.business);

    if (!business) {
      throw new BadRequestError('Invalid Business ID', { code: 'BUSINESS_NOT_FOUND' });
    }

    const data = payload?.services.map((service: Record<string, unknown>) => ({
      business: business._id,
      service: service?.service,
      price: service.price,
    }));

    await BusinessServiceDataAccess.upsertBusinessService(business._id, data);

    return 'Price Saved Successfully';
  }

  async addressPartnersByState(addressId: string): Promise<IPartnerFormatter[]> {
    const { AddressDataAccess, PartnerDataAccess } = this;

    const address = await AddressDataAccess.findAddressById(addressId);

    if (!address) {
      throw new BadRequestError('Invalid Address ID', { code: 'ADDRESS_NOT_FOUND' });
    }

    const state = address?.details?.state?.toLowerCase();

    const partners = await PartnerDataAccess.findAllPartnerInState(state);

    return partners.map((partner: Record<string, unknown>) => PartnerFormatter({ partner }));
  }

  async partnerAgentsAll(partnerId: string, addressId: string) {
    const { AgentDataAccess, AddressDataAccess } = this;

    const [address, agents] = await Promise.all([
      AddressDataAccess.findAddressById(addressId),
      AgentDataAccess.getAgentByPartnerId(partnerId),
    ]);

    if (!address) {
      throw new BadRequestError('Invalid Address ID', { code: 'ADDRESS_NOT_FOUND' });
    }

    const transformedAgents = await this.reduceAgentDataWithRedisData(agents, address);

    return transformedAgents;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async reduceAgentDataWithRedisData(agents: any, address: any) {
    const { RedisClient } = this;

    const results = [];

    for (const dbAgent of agents) {
      const agentStatus = await RedisClient.hGet(
        REDIS_LOCATION_KEY.AGENT_ONLINE_STATUS,
        dbAgent?._id?.toString(),
      );

      const agentParseObject = JSON.parse(String(agentStatus));
      // const onlineStatus = agentParseObject?.status === AgentOnlineStatus.ONLINE;

      results.push({
        distance: agentParseObject
          ? distanceBetweenPoints(
              address?.position?.latitude,
              address?.position?.longitude,
              agentParseObject?.latitude,
              agentParseObject?.longitude,
              'M',
            )
          : 0,
        presence: agentParseObject?.status || AgentOnlineStatus.OFFLINE,
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

    return results;
  }

  async unflaggedAddress(payload: UnflaggedVerificationInput) {
    const { AddressDataAccess, NotificationProvider, UserDataAccess, NotificationDataAccess } =
      this;
    const { user: userId } = payload;

    const [user, address] = await Promise.all([
      UserDataAccess.findUserById(userId),
      AddressDataAccess.findAddressByIdAndTask(payload.address),
    ]);

    if (!user) {
      throw new BadRequestError('Admin account not found', { code: 'ADMIN_NOT_FOUND' });
    }

    if (!address) {
      throw new BadRequestError('Invalid Address ID', { code: 'ADDRESS_NOT_FOUND' });
    }

    const { candidate, task: taskData } = address;

    if (!candidate) {
      throw new BadRequestError('Invalid Task Candidate.', { code: 'CANDIDATE_NOT_FOUND' });
    }

    if (![AddressStatusEnum.VERIFIED, AddressStatusEnum.FAILED].includes(address.status)) {
      throw new BadRequestError('Address has not been submitted.', {
        code: 'ADDRESS_NOT_SUBMITTED',
      });
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
      taskId: address?.task?._id,
    });

    await Promise.all([
      NotificationProvider.email.send({
        email: taskData?.business?.email,
        subject: `You address with task id ${taskData?._id} has been unflagged`,
        content: emailContent,
      }),
      NotificationDataAccess.create({
        actor: userId,
        title: `Task ${address?.task?._id} has been unflagged`,
        text: `Task ${address?.task?._id} has been unflagged`,
        modelId: address?.business,
        modelType: NotificationModelTypeEnum.BUSINESS,
        isRead: false,
      }),
      NotificationDataAccess.create({
        actor: userId,
        title: `Task ${address?.task?._id} unflagged by ${user?.firstName} ${user?.lastName}`,
        text: `Task ${address?.task?._id} unflagged by ${user?.firstName} ${user?.lastName}`,
        modelType: NotificationModelTypeEnum.ADMIN,
        isRead: false,
      }),
    ]);

    if (taskData?.business?.api?.webhook) {
      EventEmitterBroker.emit('sendTaskStatusUpdate', {
        url: taskData?.business?.api?.webhook,
        task: taskData,
      });
    }

    return 'Address Unflagged Successfully';
  }

  async rejectAddress(payload: RejectVerificationInput) {
    const {
      UserDataAccess,
      AddressDataAccess,
      NotificationProvider,
      TransactionDataAccess,
      NotificationDataAccess,
    } = this;
    const { user: userId } = payload;

    const user = await UserDataAccess.findUserById(userId);

    const address = await AddressDataAccess.findAddressByIdAndTask(payload.address);

    if (!address) {
      throw new BadRequestError('Invalid Address ID.', { code: 'ADDRESS_NOT_FOUND' });
    }

    const { candidate, task: taskData } = address;

    if (!candidate) {
      throw new BadRequestError('Invalid Task Candidate.', { code: 'CANDIDATE_NOT_FOUND' });
    }

    if (![AddressStatusEnum.CREATED].includes(address.status)) {
      throw new BadRequestError('Address cannot be rejected, status has changed ', {
        code: 'ADDRESS_NOT_REJECT',
      });
    }

    await Promise.all([
      TransactionDataAccess.refundBusiness(address),
      NotificationDataAccess.create({
        actor: user._id,
        title: `${user?.firstName} ${user?.lastName} rejected address task ${taskData?._id}`,
        text: `${user?.firstName} ${user?.lastName} rejected address task ${taskData?._id} address: ${address?.formatAddress}`,
        modelId: taskData?.business?._id,
        modelType: NotificationModelTypeEnum.ADMIN,
        isRead: false,
      }),
      NotificationDataAccess.create({
        actor: user._id,
        title: `Admin rejected address task ${taskData?._id}`,
        text: `Admin rejected address task ${taskData?._id} address: ${address?.formatAddress}`,
        modelId: taskData?.business?._id,
        modelType: NotificationModelTypeEnum.BUSINESS,
        isRead: false,
      }),
    ]);

    const emailContent = await rejectAddressEmailContent({
      address: address?.formatAddress,
      taskId: address?.task?._id,
      amount: address?.task?.cost,
    });

    await NotificationProvider.email.send({
      email: taskData?.business?.email,
      subject: `You address with task id ${taskData?._id} has been rejected`,
      content: emailContent,
    });

    if (taskData?.business?.api?.webhook) {
      EventEmitterBroker.emit('sendTaskStatusUpdate', {
        url: taskData?.business?.api?.webhook,
        task: taskData,
      });
    }

    return 'Address Rejected Successfully';
  }

  async updateAddressPartner(payload: UpdateAddressPartnerInput) {
    const { PartnerDataAccess, AddressDataAccess, NotificationProvider, config } = this;

    const [partner, address] = await Promise.all([
      PartnerDataAccess.findPartnerById(payload.partner),
      AddressDataAccess.findAddressById(payload.address),
    ]);

    if (!partner) {
      throw new BadRequestError('Invalid Partner ID', { code: 'PARTNER_NOT_FOUND' });
    }

    if (!address) {
      throw new BadRequestError('Invalid Address ID', { code: 'ADDRESS_NOT_FOUND' });
    }
    const agents = payload.agents;

    if (agents && agents.length) {
      await this.assignTaskToAgent(address, agents);
    }

    await AddressDataAccess.updateAddressById(address?._id, {
      partner: partner?._id,
      ...(agents?.length && agents?.length === 1 ? { agent: agents[0] } : undefined),
    });

    if (!partner?.email && !partner?.user?.email) {
      return 'Task Assigned Successfully';
    }

    const emailContent = await notifyPartnerAssignTask({
      address: address?.formatAddress,
      url: `${config.get('frontend.partnerUrl')}/verifications/${address?._id?.toString()}`,
      partnerName: partner?.name,
    });

    await NotificationProvider.email.send({
      email: partner?.email ?? partner?.user?.email,
      subject: `${partner?.name} Job Notification`,
      content: emailContent,
    });

    return 'Task Assigned Successfully';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async reduceAgentAndMapDistance(address: any, agents: string[]) {
    const { RedisClient } = this;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedAgents = await agents.reduce(async (acc: any, agentId: string) => {
      acc = await acc;

      const agentStatus = await RedisClient.hGet(REDIS_LOCATION_KEY.AGENT_ONLINE_STATUS, agentId);
      const agentParseObject = JSON.parse(String(agentStatus));

      const onlineStatus = agentParseObject?.status === AgentOnlineStatus.ONLINE;

      if (!onlineStatus) {
        return acc;
      }

      acc.push({
        agentId,
        distance: distanceBetweenPoints(
          address?.position?.latitude,
          address?.position?.longitude,
          agentParseObject?.latitude,
          agentParseObject?.longitude,
          'M',
        ),
        presence: agentParseObject.status,
        onlineStatus,
      });

      return acc;
    }, []);

    return mappedAgents;
  }

  async assignTaskToAgent(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    address: any,
    agents: string[],
  ) {
    const { AgentDataAccess, AgentService } = this;

    const dbAgentData = await AgentDataAccess.fetchAgentByIds(agents);

    const mappedAgents = await this.reduceAgentAndMapDistance(address, agents);

    const response = await AgentService.mergeRedisAgentWithDatabase(
      mappedAgents,
      dbAgentData,
      address?.details?.state,
    );

    await this.assignTaskToAgentFromAdmin(address, response);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async assignTaskToAgentFromAdmin(address: any, response: any) {
    const { AblyClient, AddressDataAccess } = this;

    await TaskLogic.assignTaskToAgent(AblyClient, AddressDataAccess, {
      agents: response,
      body: {
        verificationId: address?.task?._id || address?.task,
        addressId: address?._id as string,
        landmark: address?.details?.landmark as string,
        candidate: {
          lastName: address?.candidate?.lastName as string,
          firstName: address?.candidate?.firstName as string,
          phoneNumber: address?.candidate?.phoneNumber as string,
        },
        address: address?.formatAddress as string,
      },
      position: {
        longitude: address?.position?.longitude,
        latitude: address?.position?.latitude,
      },
    });
  }

  async autoFetchAllAgent(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    address: any,
  ) {
    const { AgentService } = this;
    const agents = await AgentService.fetchAgentWithAddressLocation({
      longitude: address?.position?.longitude,
      latitude: address?.position?.latitude,
      state: address?.details?.state,
    });

    return agents;
  }

  async attachPartnerToAddresses(payload: AttachPartnerToAddressesInput) {
    const {
      UserDataAccess,
      AddressDataAccess,
      AgentService,
      PartnerDataAccess,
      NotificationProvider,
      config,
      NotificationDataAccess,
    } = this;

    const user = await UserDataAccess.findUserById(payload.user);
    if (!user) {
      throw new BadRequestError('Invalid Admin User ID', { code: 'ADMIN_NOT_FOUND' });
    }

    const partner = await PartnerDataAccess.findPartnerById(payload.partner);
    if (!partner) {
      throw new BadRequestError('Invalid Partner ID', { code: 'PARTNER_NOT_FOUND' });
    }

    await AddressDataAccess.updateAddressByIds(payload.addresses, { partner: partner?._id });

    // Notify Partner
    const emailContent = await notifyPartnerAssignBulkTask({
      url: `${config.get('frontend.partnerUrl')}/verifications`,
      partnerName: partner?.name,
    });

    await Promise.all([
      NotificationProvider.email.send({
        email: partner?.email ?? partner?.user?.email,
        subject: `${partner?.name} Job Notification`,
        content: emailContent,
      }),
      NotificationDataAccess.create({
        actor: payload.user,
        text: `Admin attach address task to partner ${partner?.name}`,
        title: `Admin assigned bulk verification to ${partner?.name}`,
        modelId: partner?._id,
        modelType: NotificationModelTypeEnum.PARTNER,
        isRead: false,
      }),
      NotificationDataAccess.create({
        actor: payload.user,
        text: `${user?.firstName} ${user?.lastName} attach address task to partner ${partner?.name}`,
        title: `${user?.firstName} ${user?.lastName} assigned bulk verification to ${partner?.name}`,
        modelType: NotificationModelTypeEnum.ADMIN,
        isRead: false,
      }),
    ]);

    if (!payload.broadcastToAgent) {
      return 'Successfully Assigned to partners';
    }

    const addressesFromDb = await AddressDataAccess.findAddressByIds(payload.addresses);

    for (const address of addressesFromDb) {
      const agents = await AgentService.fetchAgentWithAddressLocation({
        latitude: address?.position?.latitude,
        longitude: address?.position?.longitude,
        state: address?.details?.state,
      });
      const validAgents = [];
      for (const agent of agents) {
        if (agent?.partner?.toString() === partner?._id?.toString()) {
          validAgents.push(agent);
        }
      }

      await this.assignTaskToAgentFromAdmin(address, validAgents);
    }

    return 'Successfully Assigned to partners';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async adminUsers(query: any): Promise<IUserFormatter[]> {
    const { AdminDataAccess, RoleDataAccess } = this;

    let roleId;

    if (query.roleName) {
      const role = await RoleDataAccess.getRoleByName(query.roleName);

      if (role) {
        roleId = role._id;
      }
    }

    const users = await AdminDataAccess.adminUsers(roleId);

    return users.map((user: Record<string, unknown>) =>
      UserFormatter({ user: { ...(user?.user ?? undefined), role: user.role } }),
    );
  }

  async getAdminRoles(): Promise<IRoleFormatter> {
    const { RoleDataAccess } = this;

    const roles = await RoleDataAccess.allAdminRoles();

    return roles.map((role: Record<string, unknown>) => RoleFormatter({ role }));
  }

  async suspendAdminUser(payload: SuspendUserInput): Promise<string> {
    const { AdminDataAccess } = this;

    await AdminDataAccess.suspendAdminUser(payload.user);

    return 'User Suspended Successfully';
  }

  async restoreAdminUser(payload: RestoreUserInput): Promise<string> {
    const { AdminDataAccess } = this;

    await AdminDataAccess.restoreAdminUser(payload.user);

    return 'User Restored Successfully';
  }

  async attachRole(payload: AttachRolesInput): Promise<string> {
    const { AdminDataAccess, RoleDataAccess, RedisClient } = this;

    const { user, role } = payload;

    const roleData = await RoleDataAccess.getRoleById(payload.role);

    if (!roleData) {
      throw new BadRequestError('Invalid Role ID', { code: 'ROLE_NOT_FOUND' });
    }

    await RedisClient.hSet(
      REDIS_LOCATION_KEY.PERMISSION,
      String(user),
      JSON.stringify(roleData.permissions),
    );

    await AdminDataAccess.updateAdminUserRole(user, role, roleData.permissions);

    return 'Role Changed Successfully';
  }

  async changeAdminUserPassword(payload: ChangeAdminPasswordInput): Promise<string> {
    const { UserDataAccess } = this;

    const { user, oldPassword, password } = payload;

    const userData = await UserDataAccess.findUserAuthById(user);

    if (!userData) {
      throw new BadRequestError('Invalid User ID', { code: 'ADMIN_USER_CONFLICT' });
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

  async disableBusiness(payload: DisableBusinessInput): Promise<string> {
    const { BusinessDataAccess } = this;

    const { business } = payload;

    await BusinessDataAccess.disableBusiness(business);

    return 'Business has been disabled successfully';
  }

  async disablePartner(payload: DisablePartnerInput): Promise<string> {
    const { PartnerDataAccess } = this;

    const { partner } = payload;

    await PartnerDataAccess.disablePartner(partner);

    return 'Partner has been disabled successfully';
  }

  async restoreBusiness(payload: DisableBusinessInput): Promise<string> {
    const { BusinessDataAccess } = this;

    const { business } = payload;

    await BusinessDataAccess.restoreBusiness(business);

    return 'Business has been restored successfully';
  }

  async restorePartner(payload: DisablePartnerInput): Promise<string> {
    const { PartnerDataAccess } = this;

    const { partner } = payload;

    await PartnerDataAccess.restorePartner(partner);

    return 'Partner has been restored successfully';
  }

  async addressMetrics(): Promise<string> {
    const { AddressDataAccess } = this;

    const [response] = await AddressDataAccess.adminAddressVerificationMetrics();

    return response;
  }

  async fundBusinessAccount(payload: FundBusinessAccountInput) {
    const { TransactionDataAccess, BusinessDataAccess } = this;

    const reference = generateUniqueReference('fund');

    await Promise.all([
      TransactionDataAccess.create({
        type: TransactionTypeEnum.CREDIT,
        amount: payload.amount,
        business: payload.business,
        user: payload.user,
        reference,
        provider: PaymentProviderEnum.WALLET,
        status: TransactionStatusEnum.SUCCESSFUL,
        paidAt: new Date(),
      }),
      BusinessDataAccess.updateBusinessWallet(payload.business, payload.amount),
    ]);

    return 'Business has been funded successfully';
  }

  async approveOtherVerification(payload: ApproveOtherVerificationInput) {
    const { TaskDataAccess, NotificationProvider, TransactionDataAccess, PaystackProvider } = this;
    const { verificationId, approved } = payload;

    const verification = await TaskDataAccess.updateTaskById(verificationId, {
      approvedByAdmin: approved,
      approvedAt: new Date(),
    });

    if (verification?.entity === EntityEnum.BUSINESS) {
      return 'Verification Approved Successfully';
    }

    if (!verification?.metadata?.email) {
      throw new BadRequestError('No customer email', { code: 'INVALID_CUSTOMER_EMAIL' });
    }

    if (!approved) {
      return 'Marked as Failed';
    }

    const reference = generateUniqueReference('fund');

    const [, response] = await Promise.all([
      TransactionDataAccess.create({
        type: TransactionTypeEnum.DEBIT,
        amount: verification?.cost,
        business: verification?.business,
        user: verification.user,
        reference,
      }),
      PaystackProvider.createTransactionLink({
        amount: verification?.cost,
        email: verification?.metadata?.email,
        reference,
        metadata: JSON.stringify({
          businessId: verification?.business,
          type: 'consumer',
          verificationId: verification?._id.toString(),
          email: verification?.metadata?.email,
        }),
      }),
    ]);

    const emailContent = await consumerVerificationApprovedContent({
      email: verification?.metadata?.email,
      link: response?.authorizationUrl,
      business: verification?.business,
    });

    await NotificationProvider.email.send({
      email: verification?.metadata?.email,
      subject: 'Your Verification request has been approved',
      content: emailContent,
    });

    return 'Verification Approved Successfully';
  }

  async approvedCustomerVerification(payload: ApproveCustomerVerificationInput) {
    const { TaskDataAccess, NotificationProvider, TransactionDataAccess, PaystackProvider } = this;
    const { verificationId, status } = payload;

    const verification = await TaskDataAccess.updateTaskById(verificationId, {
      approvedByAdmin: status,
      approvedAt: new Date(),
    });

    if (verification?.entity === EntityEnum.BUSINESS) {
      return 'Verification Approved Successfully';
    }

    if (!verification?.metadata?.email) {
      throw new BadRequestError('No customer email', { code: 'INVALID_CUSTOMER_EMAIL' });
    }

    if (!status) {
      const emailContent = await consumerVerificationDeclinedContent({
        email: verification?.metadata?.email,
        business: verification?.business,
      });

      await NotificationProvider.email.send({
        email: verification?.metadata?.email,
        subject: 'Your Verification request has been declined',
        content: emailContent,
      });

      return 'Marked as Failed';
    }

    const reference = generateUniqueReference('fund');

    const [, response] = await Promise.all([
      TransactionDataAccess.create({
        type: TransactionTypeEnum.DEBIT,
        amount: verification?.cost,
        business: verification?.business,
        user: verification.user,
        reference,
      }),
      PaystackProvider.createTransactionLink({
        amount: verification?.cost,
        email: verification?.metadata?.email,
        reference,
        metadata: JSON.stringify({
          businessId: verification?.business,
          type: 'consumer',
          verificationId: verification?._id.toString(),
          email: verification?.metadata?.email,
        }),
      }),
    ]);

    const emailContent = await consumerVerificationApprovedContent({
      email: verification?.metadata?.email,
      link: response?.authorizationUrl,
      business: verification?.business,
    });

    await NotificationProvider.email.send({
      email: verification?.metadata?.email,
      subject: 'Your Verification request has been approved',
      content: emailContent,
    });

    return 'Verification Approved Successfully';
  }

  async sendTaskToVerifier(payload: SendTaskToVerifierInput) {
    const { TaskDataAccess, AdminDataAccess, NotificationProvider, config } = this;
    const { verificationId, verifier } = payload;

    const [admin, verification] = await Promise.all([
      AdminDataAccess.findAdminByUserId(verifier),
      TaskDataAccess.fetchTaskByID(verificationId),
    ]);

    if (!verification) {
      throw new BadRequestError('Invalid verification ID', {
        code: 'INVALID_VERIFICATION_ID',
      });
    }

    if (!admin) {
      throw new BadRequestError('Invalid Admin ID', {
        code: 'INVALID_ADMIN_ID',
      });
    }

    //generate link and send to verifier
    const emailContent = await submitOtherTaskResponse({
      url: `${config.get(
        'frontend.adminUrl',
      )}/verifications/submit/${verification?._id?.toString()}`,
    });

    await NotificationProvider.email.send({
      email: admin?.user?.email,
      subject: 'A new job has been assigned to you',
      content: emailContent,
    });

    await TaskDataAccess.updateTaskById(verification?._id, {
      status: StatusEnum.INPROGRESS,
    });

    return 'Task has been sent to verifier';
  }

  async submitVerifierVerification(payload: SubmitVerifierVerificationTaskInput) {
    const { TaskDataAccess, AdminDataAccess, AgentDataAccess } = this;

    const { responseObject, verifier, verificationId, status } = payload;

    const [admin, agent, verification] = await Promise.all([
      AdminDataAccess.findAdminByUserId(verifier),
      AgentDataAccess.findByUserId(verifier),
      TaskDataAccess.fetchTaskByID(verificationId),
    ]);

    if (!verification) {
      throw new BadRequestError('Invalid verification ID', {
        code: 'INVALID_VERIFICATION_ID',
      });
    }

    if (!admin && !agent) {
      throw new BadRequestError('Invalid Admin ID', {
        code: 'INVALID_ADMIN_ID',
      });
    }

    await TaskDataAccess.updateChildEntity(
      verification,
      responseObject,
      admin?.user || agent?.user,
      status,
    );

    await TaskDataAccess.updateTaskById(verification?._id, {
      status: StatusEnum.COMPLETED,
    });

    return 'Request Submitted Successfully';
  }
}
