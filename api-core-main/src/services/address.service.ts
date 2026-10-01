import { IdentityType } from '../constants';
import { CreateIndividualAddressInput } from '../schemas/address.schema';
import { BadRequestError } from '../errors/api.error';
import TaskFormatter, { ITaskFormatter } from '../formatters/task.formatter';
import { GoogleClientInterface } from '../providers/address/types/google.type';
import AddressLogic from '../logics/address.logic';
// import TaskLogic from '../logics/task.logic';
import { CategoryEnum } from '../models/types/address.type';

export default class AddressService {
  private readonly config;
  private readonly AblyClient;
  private readonly RedisClient;
  private readonly AgentService;
  private readonly TaskDataAccess;
  private readonly AddressDataAccess;
  private readonly CandidateDataAccess;
  private readonly GoogleClientProvider: GoogleClientInterface;

  constructor({
    config,
    AblyClient,
    RedisClient,
    AgentService,
    TaskDataAccess,
    AddressDataAccess,
    CandidateDataAccess,
    GoogleClientProvider, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.AblyClient = AblyClient;
    this.RedisClient = RedisClient;
    this.AgentService = AgentService;
    this.TaskDataAccess = TaskDataAccess;
    this.AddressDataAccess = AddressDataAccess;
    this.CandidateDataAccess = CandidateDataAccess;
    this.GoogleClientProvider = GoogleClientProvider;
  }

  async createIndividualVerification(
    payload: CreateIndividualAddressInput,
  ): Promise<ITaskFormatter> {
    const {
      GoogleClientProvider,
      // AgentService,
      TaskDataAccess,
      // AddressDataAccess,
      // AblyClient,
      CandidateDataAccess,
    } = this;

    const candidate = await CandidateDataAccess.findCandidateById(payload.candidateId);

    if (!candidate) {
      throw new BadRequestError('Invalid Candidate ID.', { code: 'CANDIDATE_NOT_FOUND' });
    }

    const stringifiedAddress = await AddressLogic.stringifyAddress(payload.address);

    const { longitude, latitude } = await GoogleClientProvider.geocodeAddress(stringifiedAddress);

    const [task] = await Promise.all([
      // AgentService.fetchAgentWithAddressLocation({
      //   longitude,
      //   latitude,
      //   state: payload.address?.state,
      // }),
      TaskDataAccess.createAddressTask({
        candidate: payload.candidateId,
        business: payload.businessId,
        category: CategoryEnum.INDIVIDUAL,
        user: payload.userId,
        formatAddress: stringifiedAddress,
        details: payload.address,
        verifications: [IdentityType.ADDRESS],
        position: {
          longitude,
          latitude,
        },
      }),
    ]);

    // await TaskLogic.assignTaskToAgent(AblyClient, AddressDataAccess, {
    //   agents,
    //   body: {
    //     verificationId: task._id,
    //     addressId: task.addressId,
    //     landmark: address?.details?.landmark as string,
    //     candidate: {
    //       firstName: candidate?.firstName,
    //       lastName: candidate?.lastName,
    //       phoneNumber: candidate?.phoneNumber,
    //     },
    //     address: stringifiedAddress,
    //   },
    //   position: {
    //     longitude,
    //     latitude,
    //   },
    // });

    const taskData = await TaskDataAccess.fetchTaskByID(task?._id);

    return TaskFormatter({ task: taskData });
  }
}
