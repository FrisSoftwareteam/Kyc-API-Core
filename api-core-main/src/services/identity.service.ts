import {
  CreateBvnVerificationInput,
  ValidationDataInput,
  CreateNinVerificationInput,
} from '../schemas/identity.schema';
import { StatusEnum } from '../models/types/task.type';
import { IdentityStatusEnum } from '../models/types/identity.type';
import { IIdentityServiceType } from '../models/provider.model';
import IdentityLogic from '../logics/identity.logic';
import { IdentityType } from '../constants';
import { BadRequestError } from '../errors/api.error';
import TaskFormatter, { ITaskFormatter } from '../formatters/task.formatter';
import ServiceFormatter from '../formatters/service.formatter';
import TaskLogic from '../logics/task.logic';

interface IResponseData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber?: string;
  middleName?: string;
}

interface ICreateCandidatePayload {
  validationData: IResponseData;
  id: string;
  businessId: string;
}
export default class IdentityService {
  private readonly config;
  private readonly logger;
  private readonly TaskDataAccess;
  private readonly IdentityProvider;
  private readonly ServiceDataAccess;
  private readonly CandidateDataAccess;
  private readonly NotificationProvider;
  private readonly BusinessServiceDataAccess;

  constructor({
    config,
    logger,
    TaskDataAccess,
    IdentityProvider,
    ServiceDataAccess,
    CandidateDataAccess,
    NotificationProvider,
    BusinessServiceDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.logger = logger;
    this.TaskDataAccess = TaskDataAccess;
    this.IdentityProvider = IdentityProvider;
    this.ServiceDataAccess = ServiceDataAccess;
    this.CandidateDataAccess = CandidateDataAccess;
    this.NotificationProvider = NotificationProvider;
    this.BusinessServiceDataAccess = BusinessServiceDataAccess;
  }

  async validateCandidateData(payload: ValidationDataInput, response: IResponseData) {
    return IdentityLogic.validate(payload, response);
  }

  async createCandidate(
    type: string,
    payload: ICreateCandidatePayload,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: any,
  ) {
    const { CandidateDataAccess } = this;
    const { validationData, id, businessId } = payload;

    const candidate = await CandidateDataAccess.create({
      firstName: validationData.firstName ?? response.firstName,
      lastName: validationData.lastName ?? response.lastName,
      middleName: validationData.middleName ?? response.middleName,
      dateOfBirth: validationData.dateOfBirth ?? response.dateOfBirth,
      imageUrl: response.imageUrl || 'https://',
      phoneNumber: validationData?.phoneNumber ? validationData?.phoneNumber : response.phoneNumber,
      businessId,
      ids: {
        [type]: id,
      },
    });

    return candidate;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async matchCandidate(payload: any, response: any, type: string) {
    const { CandidateDataAccess } = this;

    const { validationData, id } = payload;

    let candidate = await CandidateDataAccess.getCandidateWithNin(id);

    if (!candidate) {
      candidate = await CandidateDataAccess.findCandidateByPhoneNumber(response.phoneNumber);

      if (!candidate) {
        candidate = await this.createCandidate(type, payload, response);
      }

      await CandidateDataAccess.updateCandidateById(candidate._id, {
        ids: {
          ...candidate.ids,
          [type]: id,
        },
      });
    }

    const matchResponse = await this.validateCandidateData(
      {
        firstName: validationData?.firstName || response.firstName,
        lastName: validationData?.lastName || response.lastName,
        dateOfBirth: validationData?.dateOfBirth || response.dateOfBirth,
      },
      response,
    );

    if (!candidate) {
      throw new BadRequestError('No Valid Candidate.', { code: 'CANDIDATE_NOT_FOUND' });
    }

    return { candidate, matchResponse };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkCandidateDataMatch(matchResponse: any) {
    if (!matchResponse) {
      return false;
    }

    const taskStatus = Object.keys(matchResponse).every(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) => {
        return matchResponse[item].matched === true;
      },
    );

    return taskStatus;
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
  public async calculateCharges(businessId: string, verifications: any) {
    let costOfVerification = {
      total: 0,
    };

    const services = await this.getBusinessServices(businessId);

    costOfVerification = TaskLogic.calculateVerificationCost(services, verifications);

    return costOfVerification;
  }

  async verifyBvnIdentity(payload: CreateBvnVerificationInput): Promise<ITaskFormatter> {
    const { TaskDataAccess, IdentityProvider } = this;

    const { validationData, id, countryCode, businessId, userId } = payload;

    await IdentityProvider.setVerificationType(IIdentityServiceType.BVN);

    const response = await IdentityProvider.fetchBvn(id, countryCode);

    const { candidate, matchResponse } = await this.matchCandidate(
      payload,
      response,
      IIdentityServiceType.BVN,
    );

    const taskStatus = this.checkCandidateDataMatch(matchResponse);

    const costOfVerification = await this.calculateCharges(businessId, {
      identity: {
        idNumber: id,
        type: IIdentityServiceType.BVN,
        dateOfBirth: validationData?.dateOfBirth,
      },
    });

    const task = await TaskDataAccess.createIdentityTask({
      candidate: candidate._id,
      business: businessId,
      user: userId,
      verifications: [IdentityType.IDENTITY],
      idType: IIdentityServiceType.BVN,
      idNumber: id,
      taskStatus: StatusEnum.COMPLETED,
      status: taskStatus === true ? IdentityStatusEnum.VERIFIED : IdentityStatusEnum.FAILED,
      response,
      validationData,
      failedReason: response?.message,
      costOfVerification,
    });

    const data = await TaskDataAccess.fetchTaskByID(task._id);

    return TaskFormatter({ task: data });
  }

  async verifyNinIdentity(payload: CreateNinVerificationInput): Promise<ITaskFormatter> {
    const { TaskDataAccess, IdentityProvider } = this;

    const { validationData, id, countryCode, businessId, userId } = payload;

    await IdentityProvider.setVerificationType(IIdentityServiceType.NIN);

    const response = await IdentityProvider.fetchNin(id, countryCode);

    const { candidate, matchResponse } = await this.matchCandidate(
      payload,
      response,
      IIdentityServiceType.NIN,
    );

    const taskStatus = this.checkCandidateDataMatch(matchResponse);

    const costOfVerification = await this.calculateCharges(businessId, {
      identity: {
        idNumber: id,
        type: IIdentityServiceType.NIN,
        dateOfBirth: validationData?.dateOfBirth,
      },
    });

    const task = await TaskDataAccess.createIdentityTask({
      candidate: candidate._id,
      business: businessId,
      user: userId,
      verifications: [IdentityType.IDENTITY],
      idType: IIdentityServiceType.NIN,
      idNumber: id,
      taskStatus: StatusEnum.COMPLETED,
      status: taskStatus === true ? IdentityStatusEnum.VERIFIED : IdentityStatusEnum.FAILED,
      response,
      validationData,
      responseStatus: response?.status,
      failedReason: response?.message,
      costOfVerification,
    });

    const data = await TaskDataAccess.fetchTaskByID(task._id);

    return TaskFormatter({ task: data });
  }

  // async bulkUploadIdentity(payload: UploadBulkIdentityInput) {
  //   // const records = await CommonLogic.extractValuesFromCsv(payload.url);

  //   // console.log({records});
  // }
}
