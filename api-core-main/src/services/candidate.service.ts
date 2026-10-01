import { CreateCandidateByFormInput } from '../schemas/candidate.schema';
import { BadRequestError } from '../errors/api.error';
import { paginationReqData, paginationMetaData } from '../utils/helper';
import CandidateFormatter, { ICandidateFormatter } from '../formatters/candidate.formatter';
import BusinessFormatter, { IBusinessFormatter } from '../formatters/business.formatter';
import TaskFormatter, { ITaskFormatter } from '../formatters/task.formatter';

export default class CandidateService {
  private readonly config;
  private readonly TaskDataAccess;
  private readonly CandidateDataAccess;
  private readonly BusinessCandidateDataAccess;

  constructor({
    config,
    TaskDataAccess,
    CandidateDataAccess,
    BusinessCandidateDataAccess, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.config = config;
    this.TaskDataAccess = TaskDataAccess;
    this.CandidateDataAccess = CandidateDataAccess;
    this.BusinessCandidateDataAccess = BusinessCandidateDataAccess;
  }

  async allCandidates(
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

    const [candidates] = await BusinessCandidateDataAccess.allAdminCandidates(
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

  async createByForm(payload: CreateCandidateByFormInput): Promise<ICandidateFormatter> {
    const { CandidateDataAccess } = this;

    // const candidateExists = await CandidateDataAccess.findCandidateByPhoneNumber(
    //   payload.phoneNumber,
    // );

    // if (candidateExists) {
    //   await CandidateDataAccess.upsertBusinessCandidate(
    //     {
    //       business: payload.businessId,
    //       candidate: candidateExists._id,
    //     },
    //     {
    //       business: payload.businessId,
    //       candidate: candidateExists._id,
    //     },
    //   );

    //   return CandidateFormatter({ candidate: candidateExists });
    // }

    const candidate = await CandidateDataAccess.create(payload);

    return CandidateFormatter({ candidate });
  }

  async getCandidateBusinesses(candidateId: string): Promise<IBusinessFormatter[]> {
    const { BusinessCandidateDataAccess } = this;

    const businesses = await BusinessCandidateDataAccess.fetchCandidateBusinesses(candidateId);

    return businesses.map((business: Record<string, unknown>) =>
      BusinessFormatter({ business: business?.business }),
    );
  }

  async getCandidateVerifications(
    candidateId: string,
    businessId: string,
    query: Record<string, unknown>,
  ): Promise<{ meta: Record<string, unknown>; tasks: ITaskFormatter[] }> {
    const { TaskDataAccess } = this;
    const { page = 1, size = 20 } = query;

    const { offset, limit, pageNum } = paginationReqData(page as number, size as number);

    const [tasks] = await TaskDataAccess.fetchTaskByCandidateId(candidateId, businessId, {
      offset,
      limit,
    });

    const meta = paginationMetaData(tasks?.metadata[0]?.total, pageNum, offset, size as number);

    return {
      meta,
      tasks: tasks?.data?.map((task: Record<string, unknown>) => TaskFormatter({ task })),
    };
  }

  async getCandidateVerificationById(businessId: string, taskId: string): Promise<ITaskFormatter> {
    const { TaskDataAccess } = this;

    const task = await TaskDataAccess.fetchTaskByIdAndBusinessID(businessId, taskId);

    if (!task) {
      throw new BadRequestError('Invalid Verification ID', { code: 'VERIFICATION_NOT_FOUND' });
    }

    return TaskFormatter({ task });
  }

  async getCandidateById(candidateId: string): Promise<ICandidateFormatter> {
    const { CandidateDataAccess } = this;

    const candidate = await CandidateDataAccess.findCandidateById(candidateId);

    if (!candidate) {
      throw new BadRequestError('Invalid Candidate ID', { code: 'CANDIDATE_NOT_FOUND' });
    }

    return CandidateFormatter({ candidate });
  }
}
