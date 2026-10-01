import { GeoReplyWith } from 'redis';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import generatePassword from 'generate-password';
import {
  InviteAgentInput,
  CompleteAgentSignupInput,
  SyncAgentLocationInput,
  SyncFcmTokenInput,
  AcceptTaskInput,
  AcceptTaskEnum,
  UpdateAgentAddressInput,
  UpdateAgentAddressStatusInput,
  SubmitAgentAddressInput,
  ChangeAgentPasswordInput,
  UpdateDisplayPictureInput,
  CreatePartnerAgentInput,
  WithdrawAgentFundInput,
  UpsertBankInput,
} from '../schemas/agent.schema';
import { NotFoundError, BadRequestError, AuthFailureError } from '../errors/api.error';
import {
  invitePartnerAgentEmailContent,
  createPartnerAgentEmailContent,
  sendPartnerAgentCredentialsEmailContent,
} from '../utils/email';
import {
  paginationReqData,
  paginationMetaData,
  getVerificationCodeAndExpiry,
  distanceBetweenPoints,
  generateUniqueReference,
} from '../utils/helper';
import { AgentOnlineStatus, AgentStatus } from '../models/types/agent.type';
import { PaymentTypeEnum, PaymentStatusEnum } from '../models/types/agent-transaction.type';
import { AddressStatusEnum } from '../models/types/address.type';
import { StatusEnum } from '../models/types/task.type';
import {
  REDIS_LOCATION_KEY,
  AGENT_MAXIMUM_DISTANCE_TO_ADDRESS,
  MAXIMUM_DISTANCE_LOCATION,
  ADDRESS_PRICES,
} from '../constants';
import AddressFormatter, { IAddressFormatter } from '../formatters/address.formatter';
import AgentFormatter, { IAgentFormatter } from '../formatters/agent.formatter';
import AgentWithdrawalFormatter, {
  IAgentWithdrawalFormatter,
} from '../formatters/agent-withdrawal.formatter';
import EventEmitterBroker from '../events';

export default class AgentService {
  private readonly config;
  private readonly RedisClient;
  private readonly TaskDataAccess;
  private readonly UserDataAccess;
  private readonly AgentDataAccess;
  private readonly PaystackProvider;
  private readonly AddressDataAccess;
  private readonly PartnerDataAccess;
  private readonly NotificationProvider;
  private readonly AgentTransactionDataAccess;
  private readonly PartnerTransactionDataAccess;

  constructor({
    config,
    RedisClient,
    TaskDataAccess,
    UserDataAccess,
    AgentDataAccess,
    PaystackProvider,
    AddressDataAccess,
    PartnerDataAccess,
    NotificationProvider,
    AgentTransactionDataAccess,
    PartnerTransactionDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.RedisClient = RedisClient;
    this.UserDataAccess = UserDataAccess;
    this.TaskDataAccess = TaskDataAccess;
    this.AgentDataAccess = AgentDataAccess;
    this.PaystackProvider = PaystackProvider;
    this.PartnerDataAccess = PartnerDataAccess;
    this.AddressDataAccess = AddressDataAccess;
    this.NotificationProvider = NotificationProvider;
    this.AgentTransactionDataAccess = AgentTransactionDataAccess;
    this.PartnerTransactionDataAccess = PartnerTransactionDataAccess;
  }

  async inviteAgent(payload: InviteAgentInput): Promise<string> {
    const { PartnerDataAccess, NotificationProvider } = this;
    const { email } = payload;

    const partner = await PartnerDataAccess.findPartnerById(payload.partner);

    if (!partner) {
      throw new NotFoundError('Partner ID not found', { code: 'PARTNER_NOT_FOUND' });
    }

    // invitation expires in hour
    const { expiryTime, verificationToken } = getVerificationCodeAndExpiry(60);

    await PartnerDataAccess.createPartnerAgentByInvite(
      {
        ...payload,
        country: partner.countryCode,
      },
      {
        inviteToken: verificationToken,
        inviteTokenExpiry: expiryTime,
      },
    );

    const emailContent = await invitePartnerAgentEmailContent({
      name: payload?.email,
      url: `https://firstcheck.com/agents/invite?verificationToken=${verificationToken}&email=${email}`,
      partner: partner?.name,
    });

    await NotificationProvider.email.send({
      email,
      subject: 'You have been invited as agent',
      content: emailContent,
    });

    return 'Invite Sent Successfully';
  }

  async createPartnerAgent(payload: CreatePartnerAgentInput): Promise<string> {
    const { PartnerDataAccess, NotificationProvider } = this;

    const partner = await PartnerDataAccess.findPartnerById(payload.partner);

    if (!partner) {
      throw new NotFoundError('Partner ID not found', { code: 'PARTNER_NOT_FOUND' });
    }

    // const password = 'password';
    const password = generatePassword.generate({
      length: 8,
      numbers: true,
    });

    await PartnerDataAccess.createPartnerAgent({
      ...payload,
      password: payload?.password ? payload.password : password,
      countryCode: partner.countryCode,
    });

    const emailContent = await sendPartnerAgentCredentialsEmailContent({
      name: payload?.email,
      url: `https://firstcheck.com`,
      partner: partner?.name,
      email: payload?.email,
      password,
    });

    await NotificationProvider.email.send({
      email: payload.email,
      subject: 'You have been invited as agent',
      content: emailContent,
    });

    return 'Account Created Successfully';
  }

  async completeAgentSignup(payload: CompleteAgentSignupInput) {
    const { PartnerDataAccess, NotificationProvider } = this;

    const { firstName, lastName, email, phoneNumber, inviteToken, password, partner } = payload;

    await PartnerDataAccess.createPartnerAgent({
      firstName,
      lastName,
      email,
      phoneNumber,
      inviteToken,
      password,
      partner,
    });

    const emailContent = await createPartnerAgentEmailContent({
      name: firstName,
    });

    await NotificationProvider.email.send({
      email,
      subject: 'Partner Invite',
      content: emailContent,
    });

    return 'Account Created Successfully';
  }

  async syncAgentLocation(payload: SyncAgentLocationInput): Promise<string> {
    const { RedisClient } = this;

    const {
      agent,
      partner,
      status,
      position: { longitude, latitude },
    } = payload;

    await Promise.all([
      RedisClient.hSet(
        REDIS_LOCATION_KEY.AGENT_ONLINE_STATUS,
        agent,
        JSON.stringify({ longitude, latitude, status, partner }),
      ),

      RedisClient.geoAdd(REDIS_LOCATION_KEY.AGENT, {
        longitude,
        latitude,
        member: JSON.stringify({ agent, partner }),
      }),
    ]);

    return 'Agent Location Sync Successfully';
  }

  async syncFcmToken(payload: SyncFcmTokenInput): Promise<string> {
    const { AgentDataAccess } = this;

    const { agent, token } = payload;

    await AgentDataAccess.saveFcmToken(agent, token);

    return 'Agent FCM Token Sync Successfully';
  }

  async acceptTask(payload: AcceptTaskInput): Promise<string> {
    const { AddressDataAccess, TaskDataAccess, AgentDataAccess } = this;

    const { agent, task, address, status } = payload;

    const [taskData, agentData] = await Promise.all([
      TaskDataAccess.fetchTaskByID(task),
      AgentDataAccess.findAgentById(agent),
    ]);

    if (!taskData) {
      throw new BadRequestError('Invalid Task ID', { code: 'TASK_NOT_FOUND' });
    }

    if (!agentData) {
      throw new BadRequestError('Invalid Agent ID', { code: 'AGENT_NOT_FOUND' });
    }

    if (status === AcceptTaskEnum.DECLINE) {
      return 'Task Declined Successfully';
    }

    // if (taskData?.address?.status !== AddressStatusEnum.CREATED) {
    //   return 'Task Accepted Already';
    // }

    await Promise.all([
      AddressDataAccess.updateAddress(
        { _id: address, task },
        {
          agent,
          status: AddressStatusEnum.ACCEPTED,
          partner: agentData?.partner?._id,
          'timelines.acceptedAt': new Date(),
        },
      ),
      // TaskDataAccess.updateTaskById(taskData._id, {
      //   status: StatusEnum.PENDING,
      // }),
    ]);

    if (taskData?.business?.api?.webhook) {
      EventEmitterBroker.emit('sendTaskStatusUpdate', {
        url: 'https://',
        task,
        status: AddressStatusEnum.ACCEPTED,
      });
    }

    return 'Task Accepted Successfully';
  }

  async fetchAgentsFromRedis(position: { longitude: number; latitude: number }) {
    const { RedisClient } = this;
    const agents = await RedisClient.GEORADIUS_WITH(
      REDIS_LOCATION_KEY.AGENT,
      position,
      AGENT_MAXIMUM_DISTANCE_TO_ADDRESS,
      'm',
      [GeoReplyWith.DISTANCE],
      'ASC',
    );

    return agents;
  }

  async fetchAgentWithAddressLocation({
    longitude,
    latitude,
    state,
  }: {
    longitude: number;
    latitude: number;
    state?: string;
  }) {
    const { AgentDataAccess } = this;

    // find agents around the location
    const agents = await this.fetchAgentsFromRedis({ longitude, latitude });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentData = await this.prepareAgentData(agents);

    const dbAgentData = await AgentDataAccess.fetchAgentByIds(
      agentData.map((item: Record<string, unknown>) => item.agentId),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.mergeRedisAgentWithDatabase(agentData, dbAgentData, state);

    return response;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async prepareAgentData(agents: any) {
    const { RedisClient } = this;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentData = await agents.reduce(async (acc: any, agent: Record<string, unknown>) => {
      // await accumulator because reduce return aync function
      acc = await acc;

      const agentObject = JSON.parse(String(agent.member));

      const agentStatus = await RedisClient.hGet(
        REDIS_LOCATION_KEY.AGENT_ONLINE_STATUS,
        agentObject?.agent,
      );
      const agentParseObject = JSON.parse(String(agentStatus));

      const onlineStatus = agentParseObject.status === AgentOnlineStatus.ONLINE;

      if (!onlineStatus) {
        return acc;
      }

      acc.push({
        agentId: agentObject?.agent,
        distance: Math.ceil(agent?.distance as number),
        presence: agentParseObject.status,
        onlineStatus,
      });

      return acc;
    }, []);

    return agentData;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async mergeRedisAgentWithDatabase(agentData: any, dbAgentData: any, state?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = agentData.reduce((acc: any, agent: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dbAgentData.forEach((item: any) => {
        if (
          String(item._id) === String(agent.agentId) &&
          // item.onlineStatus === AgentOnlineStatus.ONLINE &&
          item.status === AgentStatus.ACTIVE
        ) {
          let amount = 0;

          if (state) {
            const addressPrices = item?.partner?.prices?.address?.agent;
            // optimize
            amount = ['lagos', 'lagos state'].includes(state?.toLowerCase())
              ? addressPrices?.lagos || ADDRESS_PRICES.AGENT.lagos
              : addressPrices?.others || ADDRESS_PRICES.AGENT.others;
          }

          return acc.push({
            ...agent,
            fcmTokens: item.fcmTokens,
            eventId: item.eventId,
            partner: item?.partner?._id,
            price: amount,
          });
        }
      });

      return acc;
    }, []);

    return response;
  }

  async agentMetrics(agentId: string, query: Record<string, unknown>) {
    const { AddressDataAccess } = this;

    const metrics = await AddressDataAccess.agentDashboardMetrics(agentId, query.period || 0);

    return metrics[0];
  }

  async agentTrendings(
    agentId: string,
    query: Record<string, unknown>,
  ): Promise<IAddressFormatter[]> {
    const { AddressDataAccess } = this;

    const trendings = await AddressDataAccess.agentTrendings(
      agentId,
      query.status,
      query.period || 0,
    );

    return trendings.map((trending: Record<string, unknown>) =>
      AddressFormatter({ address: trending }),
    );
  }

  async agentVerifications(
    agentId: string,
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; addresses: IAddressFormatter[] }> {
    const { AddressDataAccess } = this;

    const { page = 1, size = 20, status, period } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);

    const [addresses] = await AddressDataAccess.agentVerifications(agentId, status, period, {
      offset,
      limit,
    });

    const meta = paginationMetaData(addresses?.metadata[0]?.total, pageNum, offset, size as number);

    return {
      meta,
      addresses: addresses?.data?.map((address: Record<string, unknown>) =>
        AddressFormatter({ address }),
      ),
    };
  }

  async viewAgentTaskById({
    agentId,
    addressId,
  }: {
    agentId: string;
    addressId: string;
  }): Promise<IAddressFormatter | undefined> {
    const { AddressDataAccess } = this;

    const address = await AddressDataAccess.fetchAgentAddressByID(addressId, agentId);

    if (!address) {
      throw new NotFoundError('Address ID not found', { code: 'ADDRESS_NOT_FOUND' });
    }

    return AddressFormatter({ address });
  }

  async updateAgentAddress(payload: UpdateAgentAddressInput): Promise<string> {
    const { AddressDataAccess } = this;

    const {
      agent,
      notes,
      address,
      images,
      signature,
      buildingType,
      buildingColor,
      gatePresent,
      gateColor,
      closestLandmark,
      audioUrl,
      videoUrl,
    } = payload;

    await AddressDataAccess.updateAddress(
      { _id: address, agent },
      {
        ...(notes ? { notes } : undefined),
        ...(images ? { images } : undefined),
        ...(signature ? { signature } : undefined),
        ...(buildingType ? { 'agentReports.buildingType': buildingType } : undefined),
        ...(buildingColor ? { 'agentReports.buildingColor': buildingColor } : undefined),
        ...(gatePresent ? { 'agentReports.gatePresent': gatePresent } : undefined),
        ...(gateColor ? { 'agentReports.gateColor': gateColor } : undefined),
        ...(closestLandmark ? { 'agentReports.closestLandmark': closestLandmark } : undefined),
        ...(audioUrl ? { 'agentReports.audioUrl': audioUrl } : undefined),
        ...(videoUrl ? { 'agentReports.videoUrl': videoUrl } : undefined),
      },
    );

    return 'Address Updated Successfully';
  }

  async updateAgentAddressStatus(payload: UpdateAgentAddressStatusInput): Promise<string> {
    const { AddressDataAccess, TaskDataAccess } = this;

    const { agent, address, status } = payload;

    const addressData = await AddressDataAccess.fetchAgentAddressByID(address, agent);

    if (!addressData) {
      throw new BadRequestError('Invalid Address ID', { code: 'ADDRESS_NOT_FOUND' });
    }

    const taskData = await TaskDataAccess.fetchTaskByID(addressData.task);

    if (!taskData) {
      throw new BadRequestError('Invalid Task ID', { code: 'TASK_NOT_FOUND' });
    }

    await AddressDataAccess.updateAddress({ _id: address, task: taskData._id }, { status });

    if (taskData?.business?.api?.webhook) {
      EventEmitterBroker.emit('sendTaskStatusUpdate', {
        url: taskData?.business?.api?.webhook,
        task: taskData,
        status,
      });
    }

    return `Task Updated to ${status} Successfully`;
  }

  async submitAddress(payload: SubmitAgentAddressInput): Promise<string> {
    const { AddressDataAccess, TaskDataAccess, AgentDataAccess } = this;

    const { agent: agentId, address, status, position } = payload;

    const [agent, addressData] = await Promise.all([
      AgentDataAccess.findAgentById(agentId),
      AddressDataAccess.fetchAgentAddressByID(address, agentId),
    ]);

    if (!agent) {
      throw new BadRequestError('Invalid Agent ID', { code: 'AGENT_NOT_FOUND' });
    }

    if (!addressData) {
      throw new BadRequestError('Invalid Address ID', { code: 'ADDRESS_NOT_FOUND' });
    }
    const { partner } = agent;

    if (!partner) {
      throw new BadRequestError('Invalid Partner Link to agent', { code: 'PARTNER_NOT_FOUND' });
    }

    if ([AddressStatusEnum.VERIFIED, AddressStatusEnum.FAILED].includes(addressData?.status)) {
      return 'Task Submitted Already';
    }

    const taskData = await TaskDataAccess.fetchTaskByID(addressData.task);

    if (!taskData) {
      throw new BadRequestError('Invalid Task ID', { code: 'TASK_NOT_FOUND' });
    }

    if (!addressData?.images?.length) {
      throw new BadRequestError('Required Images are missing, please upload signature', {
        code: 'IMAGES_MISSING',
      });
    }

    if (!addressData?.notes) {
      throw new BadRequestError('Required Notes are is missing, please upload signature', {
        code: 'NOTE_MISSING',
      });
    }

    if (!addressData?.signature) {
      throw new BadRequestError('Signature is missing, please upload your signature', {
        code: 'SIGNATURE_MISSING',
      });
    }

    const positionDistance = distanceBetweenPoints(
      addressData?.position?.latitude,
      addressData?.position?.longitude,
      position?.latitude,
      position?.longitude,
      'M',
    );

    let flagged = false;

    if (positionDistance > MAXIMUM_DISTANCE_LOCATION) {
      flagged = true;
    }

    if (addressData?.isFlagged && addressData?.timelines?.completedAt) {
      await this.deductAgentOutstandingWallet(partner, addressData, agent);
    }

    await Promise.all([
      AddressDataAccess.updateAddress(
        { _id: address, task: taskData._id },
        {
          status,
          submittedAt: new Date(),
          'timelines.completedAt': new Date(),
          submissionLocation: position,
          isFlagged: flagged,
        },
      ),
      TaskDataAccess.updateTaskById(addressData.task, {
        completedAt: new Date(),
        status: StatusEnum.COMPLETED,
      }),
    ]);

    if (taskData?.business?.api?.webhook) {
      EventEmitterBroker.emit('sendTaskStatusUpdate', {
        url: taskData?.business?.api?.webhook,
        task: taskData,
        status,
      });
    }

    // const task = await TaskDataAccess.fetchTaskByID(addressData.task);

    // if (![AddressStatusEnum.VERIFIED, AddressStatusEnum.FAILED].includes(addressData.status)) {
    //   return 'Task Submitted Successfully';
    // }

    // const allTaskCompleted = await CommonLogic.allTaskCompleted(task);

    // await Promise.all([
    //   this.updateTaskStatus(allTaskCompleted, addressData.task),
    //   this.updateAgentWallet(partner, addressData, agent, flagged),
    // ]);

    await this.addAgentTransaction(partner, addressData, agent);

    return 'Task Submitted Successfully';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async addAgentTransaction(partner: any, addressData: any, agent: any) {
    const { AgentTransactionDataAccess, PartnerTransactionDataAccess } = this;

    const reference = generateUniqueReference('payment');

    const addressPrices = partner?.prices?.address?.agent;
    const partnerAddressPrices = partner?.prices?.address?.partner;

    const amount = ['lagos', 'lagos state'].includes(addressData?.details?.state?.toLowerCase())
      ? addressPrices?.lagos || ADDRESS_PRICES.AGENT.lagos
      : addressPrices?.others || ADDRESS_PRICES.AGENT.others;

    const partnerAmount = ['lagos', 'lagos state'].includes(
      addressData?.details?.state?.toLowerCase(),
    )
      ? partnerAddressPrices?.lagos || ADDRESS_PRICES.PARTNER.lagos
      : partnerAddressPrices?.others || ADDRESS_PRICES.PARTNER.others;

    await Promise.all([
      AgentTransactionDataAccess.create({
        agent: agent._id,
        task: addressData.task,
        amount,
        type: PaymentTypeEnum.PAYMENT,
        transferCode: '-',
        // paidAt: new Date(),
        accountNumber: '-',
        bankName: '-',
        reference,
        status: PaymentStatusEnum.PENDING,
      }),
      PartnerTransactionDataAccess.create({
        partner: partner._id,
        task: addressData.task,
        amount: partnerAmount,
        // amount: Number(partnerAmount - amount),
        type: PaymentTypeEnum.PAYMENT,
        transferCode: '-',
        // paidAt: new Date(),
        accountNumber: '-',
        bankName: '-',
        reference,
        status: PaymentStatusEnum.PENDING,
      }),
    ]);
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
  async updateAgentWallet(partner: any, addressData: any, agent: any, flagged: boolean) {
    const {
      AgentDataAccess,
      AgentTransactionDataAccess,
      PartnerDataAccess,
      PartnerTransactionDataAccess,
    } = this;
    const addressPrices = partner?.prices?.address?.agent;

    const reference = generateUniqueReference('payment');

    const amount = ['lagos', 'lagos state'].includes(addressData?.details?.state?.toLowerCase())
      ? addressPrices?.lagos || ADDRESS_PRICES.AGENT.lagos
      : addressPrices?.others || ADDRESS_PRICES.AGENT.others;

    Promise.all([
      AgentDataAccess.updateAgentById(agent._id, {
        wallet: {
          ...agent?.wallet,
          outstandingPayment: Number((agent?.wallet?.outstandingPayment || 0) + amount),
          ...(!flagged
            ? {
                withdrawableAmount: Number((agent?.wallet?.withdrawableAmount || 0) + amount),
              }
            : undefined),
        },
      }),
      PartnerDataAccess.updatePartnerById(partner._id, {
        wallet: {
          ...partner?.wallet,
          outstandingPayment: Number((partner?.wallet?.outstandingPayment || 0) + amount),
          ...(!flagged
            ? {
                withdrawableAmount: Number((partner?.wallet?.withdrawableAmount || 0) + amount),
              }
            : undefined),
        },
      }),
      AgentTransactionDataAccess.create({
        agent: agent._id,
        task: addressData.task,
        amount,
        type: PaymentTypeEnum.PAYMENT,
        transferCode: '-',
        paidAt: new Date(),
        accountNumber: '-',
        bankName: '-',
        reference,
        status: flagged ? PaymentStatusEnum.PENDING : PaymentStatusEnum.SUCCESSFUL,
      }),
      PartnerTransactionDataAccess.create({
        partner: partner._id,
        task: addressData.task,
        amount,
        type: PaymentTypeEnum.PAYMENT,
        transferCode: '-',
        paidAt: new Date(),
        accountNumber: '-',
        bankName: '-',
        reference,
        status: flagged ? PaymentStatusEnum.PENDING : PaymentStatusEnum.SUCCESSFUL,
      }),
    ]);

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async deductAgentOutstandingWallet(partner: any, addressData: any, agent: any) {
    const {
      AgentDataAccess,
      PartnerDataAccess,
      AgentTransactionDataAccess,
      PartnerTransactionDataAccess,
    } = this;
    const addressPrices = partner?.prices?.address?.agent;
    const partnerAddressPrices = partner?.prices?.address?.agent;

    const amount = ['lagos', 'lagos state'].includes(addressData?.details?.state?.toLowerCase())
      ? addressPrices?.lagos || ADDRESS_PRICES.AGENT.lagos
      : addressPrices?.others || ADDRESS_PRICES.AGENT.others;

    const partnerAmount = ['lagos', 'lagos state'].includes(
      addressData?.details?.state?.toLowerCase(),
    )
      ? partnerAddressPrices?.lagos || ADDRESS_PRICES.PARTNER.lagos
      : partnerAddressPrices?.others || ADDRESS_PRICES.PARTNER.others;

    const agentTransactionData = await AgentTransactionDataAccess.findLastTransactionByTask(
      addressData?.task,
    );

    const partnerTransactionData = await PartnerTransactionDataAccess.findLastTransactionByTask(
      addressData?.task,
    );

    Promise.all([
      AgentDataAccess.updateAgentById(agent._id, {
        wallet: {
          ...agent?.wallet,
          outstandingPayment: Number((agent?.wallet?.outstandingPayment || 0) - amount),
        },
      }),
      PartnerDataAccess.updatePartnerById(agent._id, {
        wallet: {
          ...partner?.wallet,
          outstandingPayment: Number((partner?.wallet?.outstandingPayment || 0) - partnerAmount),
          // outstandingPayment: Number((partner?.wallet?.outstandingPayment || 0) - (partnerAmount - amount)), TODO change if they need otherwise
        },
      }),
      AgentTransactionDataAccess.updateTransactionById(agentTransactionData?._id, {
        status: PaymentStatusEnum.RETRACTED,
      }),
      PartnerTransactionDataAccess.updateTransactionById(partnerTransactionData?._id, {
        status: PaymentStatusEnum.RETRACTED,
      }),
    ]);

    return true;
  }

  async agentProfile(agentId: string): Promise<IAgentFormatter> {
    const { AgentDataAccess } = this;

    const agent = await AgentDataAccess.findAgentById(agentId);

    if (!agent) {
      throw new BadRequestError('Invalid Agent ID', { code: 'AGENT_NOT_FOUND' });
    }

    return AgentFormatter({ agent });
  }

  async findAgentById(agentId: string) {
    const { AgentDataAccess } = this;

    const agent = await AgentDataAccess.findAgentById(agentId);

    if (!agent) {
      throw new BadRequestError('Invalid Agent ID', { code: 'AGENT_NOT_FOUND' });
    }

    return agent;
  }

  async changeAgentPassword(payload: ChangeAgentPasswordInput): Promise<string> {
    const { AgentDataAccess, UserDataAccess } = this;

    const { agent, oldPassword, password } = payload;

    const agentData = await AgentDataAccess.findAgentById(agent);

    if (!agentData) {
      throw new BadRequestError('Invalid Agent ID', { code: 'AGENT_NOT_FOUND' });
    }

    const user = await UserDataAccess.findUserAuthById(agentData?.user?._id);

    if (!user) {
      throw new BadRequestError('Invalid User ID', { code: 'AGENT_USER_CONFLICT' });
    }

    if (!(await user.comparePasswords(oldPassword, user.password))) {
      throw new AuthFailureError('Old Password not match', {
        code: 'PASSWORD_NOT_MATCH',
      });
    }

    await UserDataAccess.updateUserById(user._id, {
      password: await user.hashPassword(password),
      mustChangePassword: false,
    });

    return 'Password Changed Successfully';
  }

  async updateDisplayImage(payload: UpdateDisplayPictureInput): Promise<string> {
    const { AgentDataAccess } = this;

    const { agent, imageUrl } = payload;

    await AgentDataAccess.updateAgentById(agent, { imageUrl });

    return 'Display Picture Changed Successfully';
  }

  async withdrawFund(payload: WithdrawAgentFundInput): Promise<string> {
    const { PaystackProvider, AgentTransactionDataAccess, AgentDataAccess } = this;
    const { amount, agent: agentId } = payload;

    const agent = await this.findAgentById(agentId);

    if (amount > (agent?.wallet?.withdrawableAmount || 0)) {
      throw new BadRequestError('Amount Exceed Withdrawable Balance', {
        code: 'AMOUNT_EXCEED_WITHDRAWABLE',
      });
    }

    const reference = generateUniqueReference('transfer');

    const transfer = await PaystackProvider.transfer({
      reason: `${agent?.user?.firstName} - ${agent?.user?.lastName} - Withdrawal`,
      amount: Number(amount * 100),
      recipientCode: agent?.bank?.recipientCode,
      reference,
    });

    await Promise.all([
      AgentDataAccess.updateAgentById(agent._id, {
        wallet: {
          ...agent?.wallet,
          withdrawableAmount: Number((agent?.wallet?.withdrawableAmount || 0) - amount),
        },
      }),
      AgentTransactionDataAccess.create({
        agent: agent._id,
        amount,
        transferCode: transfer.transferCode,
        paidAt: new Date(),
        accountNumber: agent?.bank?.accountNumber,
        bankName: agent?.bank?.bankName,
        reference,
        type: PaymentTypeEnum.WITHDRAWAL,
      }),
    ]);

    return 'Request Recieved, amount will be debited into your account';
  }

  async upsertBank(payload: UpsertBankInput): Promise<string> {
    const { PaystackProvider, AgentDataAccess } = this;

    const { agent: agentId, accountNumber, bankCode } = payload;

    const agent = await this.findAgentById(agentId);

    const bankDetails = await PaystackProvider.createTransferRecipient({
      accountNumber,
      bankCode,
    });

    await AgentDataAccess.updateAgentById(agent._id, {
      bank: {
        bankName: bankDetails?.bankName,
        accountNumber: bankDetails?.accountNumber,
        accountName: bankDetails?.accountName,
        recipientCode: bankDetails?.recipientCode,
      },
    });

    return 'Bank has been added';
  }

  async agentWithdrawals(
    agentId: string,
    query: Record<string, unknown>,
  ): Promise<{
    meta: Record<string, unknown>;
    transactions: IAgentWithdrawalFormatter[];
  }> {
    const { AgentTransactionDataAccess } = this;
    const { page = 1, size = 20, period, type, status, customStartDate, customEndDate } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);

    const [withdrawals] = await AgentTransactionDataAccess.allAgentWithdrawals(
      agentId,
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
        AgentWithdrawalFormatter({
          withdrawal: {
            ...withdrawal,
            agent: withdrawal?.agent[0],
          },
        }),
      ),
    };
  }
}
