import { Types } from 'mongoose';
import { endOfDay, subDays, startOfDay, addHours } from 'date-fns';
import { BadRequestError } from '../errors/api.error';
import { StatusEnum, EntityEnum, ChargeTypeEnum } from '../models/types/task.type';
import { IdentityStatusEnum } from '../models/types/identity.type';
import CommonLogic from '../logics/common.logic';
import { AddressStatusEnum, CategoryEnum } from '../models/types/address.type';
import { VerificationSlugEnum } from '../constants';

const { ObjectId } = Types;

export default class TaskDataAccess {
  private readonly logger;
  private readonly fillable;
  private readonly AmlModel;
  private readonly TaskModel;
  private readonly AddressModel;
  private readonly DocumentModel;
  private readonly IdentityModel;
  private readonly BusinessModel;
  private readonly ProjectModel;
  private readonly OtherTaskModel;
  private readonly CandidateModel;
  private readonly BankStatementModel;
  private readonly mongooseConnection;
  private readonly AcademicDocumentModel;
  private readonly TransactionDataAccess;
  private readonly BusinessPartnershipModel;
  private readonly MarriageModel;
  private readonly CriminalModel;
  private readonly GuarantorVerificationModel;
  private readonly EmploymentVerificationModel;
  private readonly TenancyModel;
  private readonly HouseholdModel;
  private readonly BusinessVerificationModel;

  constructor({
    logger,
    AmlModel,
    TaskModel,
    ProjectModel,
    AddressModel,
    DocumentModel,
    IdentityModel,
    BusinessModel,
    OtherTaskModel,
    CandidateModel,
    BankStatementModel,
    mongooseConnection,
    TransactionDataAccess,
    AcademicDocumentModel,
    BusinessPartnershipModel,
    CriminalModel,
    MarriageModel,
    TenancyModel,
    HouseholdModel,
    BusinessVerificationModel,
    GuarantorVerificationModel,
    EmploymentVerificationModel, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    this.logger = logger;
    this.fillable = [
      'tat',
      'cost',
      'user',
      'paid',
      'entity',
      'status',
      'business',
      'approved',
      'metadata',
      'createdAt',
      'candidate',
      'approvedAt',
      'completedAt',
      'paymentType',
      'failedReason',
      'identityData',
      'verifications',
      'candidateAlias',
      'paymentRequired',
      'approvedByAdmin',
      'needAdminApproval',
    ].join(' ');
    this.AmlModel = AmlModel;
    this.TaskModel = TaskModel;
    this.ProjectModel = ProjectModel;
    this.AddressModel = AddressModel;
    this.DocumentModel = DocumentModel;
    this.IdentityModel = IdentityModel;
    this.BusinessModel = BusinessModel;
    this.OtherTaskModel = OtherTaskModel;
    this.CandidateModel = CandidateModel;
    this.BankStatementModel = BankStatementModel;
    this.mongooseConnection = mongooseConnection;
    this.TransactionDataAccess = TransactionDataAccess;
    this.AcademicDocumentModel = AcademicDocumentModel;
    this.BusinessPartnershipModel = BusinessPartnershipModel;
    this.MarriageModel = MarriageModel;
    this.CriminalModel = CriminalModel;
    this.TenancyModel = TenancyModel;
    this.HouseholdModel = HouseholdModel;
    this.BusinessVerificationModel = BusinessVerificationModel;
    this.GuarantorVerificationModel = GuarantorVerificationModel;
    this.EmploymentVerificationModel = EmploymentVerificationModel;
  }

  async createAddressTask(payload: Record<string, unknown>) {
    const { logger, TaskModel, AddressModel, mongooseConnection } = this;

    const session = await mongooseConnection.startSession();

    session.startTransaction();

    try {
      const task = await TaskModel.create(
        [
          {
            candidate: payload.candidate,
            business: payload.business,
            user: payload.user,
            verifications: payload.verifications,
          },
        ],
        { session },
      );

      const address = await AddressModel.create(
        [
          {
            candidate: payload.candidate,
            business: payload.business,
            task: task[0]._id,
            formatAddress: payload.formatAddress,
            position: payload.position,
            category: payload.category,
            details: payload.details,
          },
        ],
        session,
      );

      await session.commitTransaction();

      return { ...task[0]._doc, addressId: address[0]._id };
    } catch (error) {
      logger.error('abort transaction', error);
      await session.abortTransaction();

      throw new BadRequestError(error as string);
    } finally {
      session.endSession();
    }
  }

  async createBankStatementTask(payload: Record<string, unknown>) {
    const { logger, TaskModel, AddressModel, mongooseConnection } = this;

    const session = await mongooseConnection.startSession();

    session.startTransaction();

    try {
      const task = await TaskModel.create(
        [
          {
            candidate: payload.candidate,
            business: payload.business,
            user: payload.user,
            verifications: payload.verifications,
          },
        ],
        { session },
      );

      const address = await AddressModel.create(
        [
          {
            candidate: payload.candidate,
            business: payload.business,
            task: task[0]._id,
            formatAddress: payload.formatAddress,
            position: payload.position,
            category: payload.category,
            details: payload.details,
          },
        ],
        session,
      );

      await session.commitTransaction();

      return { ...task[0]._doc, addressId: address[0]._id };
    } catch (error) {
      logger.error('abort transaction', error);
      await session.abortTransaction();

      throw new BadRequestError(error as string);
    } finally {
      session.endSession();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createIdentityTask(payload: any) {
    const {
      logger,
      TaskModel,
      IdentityModel,
      mongooseConnection,
      BusinessModel,
      TransactionDataAccess,
    } = this;

    const session = await mongooseConnection.startSession();

    session.startTransaction();

    try {
      const { costOfVerification } = payload;

      const business = await BusinessModel.findById(payload.business).session(session);

      const walletBalance = business?.wallet?.balance || 0;

      if (walletBalance < Number(costOfVerification.total)) {
        throw new BadRequestError('Wallet Balance too low', { code: 'WALLET_BALANCE_LOW' });
      }

      const task = await TaskModel.create(
        [
          {
            candidate: payload.candidate,
            business: payload.business,
            user: payload.user,
            verifications: payload.verifications,
            status: payload.taskStatus,
            cost: costOfVerification.total,
            failedReason: payload?.failedReason ? payload.failedReason : undefined,
          },
        ],
        { session },
      );

      let identityId;

      if (payload?.response?.chargeIdentity) {
        await TransactionDataAccess.chargeBusiness(
          task[0]._id,
          task[0].user,
          business._id,
          costOfVerification.total,
        );
      }

      if (payload?.response?.status) {
        const identity = await IdentityModel.create(
          [
            {
              candidate: payload.candidate,
              business: payload.business,
              task: task[0]._id,
              idNumber: payload.idNumber,
              idType: payload.idType,
              status: payload.status,
              identityResponse: payload.response,
              validationData: payload.validationData,
            },
          ],
          session,
        );

        identityId = identity[0]._id;
      }

      await session.commitTransaction();

      return { ...task[0]._doc, identityId };
    } catch (error) {
      logger.error('abort transaction', error);
      await session.abortTransaction();

      throw new BadRequestError(error as string);
    } finally {
      session.endSession();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createVerifications(payload: any) {
    const { logger, TaskModel, BusinessModel, mongooseConnection } = this;

    const session = await mongooseConnection.startSession();

    session.startTransaction();

    try {
      const { costOfVerification, entityType } = payload;

      const business = await BusinessModel.findById(payload.businessId).session(session);

      const walletBalance = business?.wallet?.balance || 0;

      if (walletBalance < costOfVerification.total) {
        throw new BadRequestError('Wallet Balance too low', { code: 'WALLET_BALANCE_LOW' });
      }

      const task = await TaskModel.create(
        [
          {
            candidate: payload.candidateId,
            candidateAlias: payload?.alias,
            business: payload.businessId,
            user: payload.userId,
            cost: payload.cost,
            paymentType: payload.paymentType,
            tat: payload?.tat,
            verifications: Object.keys(payload.verifications),
            failedReason: payload?.failedReason ? payload.failedReason : undefined,
            ...(entityType === EntityEnum.CUSTOMER
              ? {
                  entity: entityType,
                  paymentRequired: true,
                  needAdminApproval: true,
                  paymentType: ChargeTypeEnum.CARD,
                }
              : undefined),
          },
        ],
        { session },
      );

      if (payload.verifications.address) {
        await this.chargeBusiness({
          taskId: task[0]._id,
          taskUser: task[0].user,
          businessId: business._id,
          costOfVerification,
          service: 'address',
          entityType,
        });

        await this.createAddressVerification(task, business, payload, costOfVerification, session);
      }

      if (payload.verifications.identity) {
        if (payload.chargeIdentity) {
          await this.chargeBusiness({
            taskId: task[0]._id,
            taskUser: task[0].user,
            businessId: business._id,
            costOfVerification,
            service: payload?.verifications?.identity.type as string,
            entityType,
          });
        }

        await this.createIdentityVerification(task, business, payload, costOfVerification, session);
      }

      if (payload.verifications.bankStatement) {
        await this.chargeBusiness({
          taskId: task[0]._id,
          taskUser: task[0].user,
          businessId: business._id,
          costOfVerification,
          service: 'bank-statement',
          entityType,
        });

        await this.createBankStatementVerification(
          task,
          business,
          payload,
          costOfVerification,
          session,
        );

        await this.updateTaskById(task[0]._id, { status: StatusEnum.COMPLETED });
      }

      if (payload.verifications.documents) {
        await this.chargeBusiness({
          taskId: task[0]._id,
          taskUser: task[0].user,
          businessId: business._id,
          costOfVerification,
          service: 'document-verifications',
          entityType,
        });

        await this.createDocumentVerification(task, business, payload, costOfVerification, session);
      }

      if (payload.verifications.academicDocuments) {
        await this.chargeBusiness({
          taskId: task[0]._id,
          taskUser: task[0].user,
          businessId: business._id,
          costOfVerification,
          service: 'academic-documents',
          entityType,
        });

        await this.createAcademicVerification(task, business, payload, costOfVerification, session);
      }

      if (payload.verifications.projectVerification) {
        await this.chargeBusiness({
          taskId: task[0]._id,
          taskUser: task[0].user,
          businessId: business._id,
          costOfVerification,
          service: 'project-verification',
          entityType,
        });

        await this.createProjectModelVerification(
          task,
          business,
          payload,
          costOfVerification,
          session,
        );
      }

      if (payload.verifications.businessPartnership) {
        await this.chargeBusiness({
          taskId: task[0]._id,
          taskUser: task[0].user,
          businessId: business._id,
          costOfVerification,
          service: 'business-partnership',
          entityType,
        });

        await this.createBusinessPartnershipVerification(
          task,
          business,
          payload,
          costOfVerification,
          session,
        );
      }

      if (payload.verifications.guarantorVerification) {
        await this.chargeBusiness({
          taskId: task[0]._id,
          taskUser: task[0].user,
          businessId: business._id,
          costOfVerification,
          service: 'guarantor-verification',
          entityType,
        });

        await this.createGuarantorVerification(
          task,
          business,
          payload,
          costOfVerification,
          session,
        );
      }

      if (payload.verifications.employmentVerification) {
        await this.chargeBusiness({
          taskId: task[0]._id,
          taskUser: task[0].user,
          businessId: business._id,
          costOfVerification,
          service: 'employment-verification',
          entityType,
        });

        await this.createEmploymentVerification(
          task,
          business,
          payload,
          costOfVerification,
          session,
        );
      }

      if (payload.verifications.marriage) {
        await this.chargeBusiness({
          taskId: task[0]._id,
          taskUser: task[0].user,
          businessId: business._id,
          costOfVerification,
          service: 'marriage',
          entityType,
        });

        await this.createMarriageVerification(task, business, payload, costOfVerification, session);
      }

      if (payload.verifications.criminal) {
        await this.chargeBusiness({
          taskId: task[0]._id,
          taskUser: task[0].user,
          businessId: business._id,
          costOfVerification,
          service: 'criminal',
          entityType,
        });

        await this.createCriminalVerification(task, business, payload, costOfVerification, session);
      }

      if (payload.verifications.tenancy) {
        await this.chargeBusiness({
          taskId: task[0]._id,
          taskUser: task[0].user,
          businessId: business._id,
          costOfVerification,
          service: 'tenancy',
          entityType,
        });

        await this.createTenancyVerification(task, business, payload, costOfVerification, session);
      }

      if (payload.verifications.household) {
        await this.chargeBusiness({
          taskId: task[0]._id,
          taskUser: task[0].user,
          businessId: business._id,
          costOfVerification,
          service: 'household',
          entityType,
        });

        await this.createHouseholdVerification(
          task,
          business,
          payload,
          costOfVerification,
          session,
        );
      }

      if (payload.verifications.aml) {
        if (payload.chargeIdentity) {
          await this.chargeBusiness({
            taskId: task[0]._id,
            taskUser: task[0].user,
            businessId: business._id,
            costOfVerification,
            service: 'aml',
            entityType,
          });
        }

        await this.createAmlVerification(task, business, payload, costOfVerification, session);
      }

      if (payload.verifications.businessVerification) {
        await this.chargeBusiness({
          taskId: task[0]._id,
          taskUser: task[0].user,
          businessId: business._id,
          costOfVerification,
          service: 'business-verification',
          entityType,
        });

        await this.createBusinessVerification(task, business, payload, costOfVerification, session);
      }

      await session.commitTransaction();
      await this.updateTaskIfCompleted(task[0]);

      return { ...task[0]._doc };
    } catch (error) {
      logger.error('abort transaction', error);
      await session.abortTransaction();

      throw new BadRequestError(error as string);
    } finally {
      session.endSession();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createTenancyVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const {
      TenancyModel,
      AddressModel,
      EmploymentVerificationModel,
      BusinessPartnershipModel,
      GuarantorVerificationModel,
    } = this;

    let identityId;
    let addressId;
    let employmentId;
    let businessVerificationId;
    let guarantorId;
    if (payload.verifications.tenancy.identityVerification) {
      const identity = await this.createIdentityVerification(
        task,
        business,
        {
          candidate: payload.candidate,
          business: payload.business,
          task: task[0]._id,
          idNumber: payload.verifications.tenancy.identityVerification.idNumber,
          idType: payload.verifications.tenancy.identityVerification.type,
          status: payload?.responseStatus ? IdentityStatusEnum.VERIFIED : IdentityStatusEnum.FAILED,
          identityResponse: payload?.identityResponse,
          validationData: payload?.validationData,
          cost: 0,
        },
        costOfVerification,
        session,
      );

      identityId = identity[0]?._id;
    }
    if (payload.verifications.tenancy.addressVerification) {
      const address = await AddressModel.create(
        [
          {
            candidate: payload.candidateId,
            business: payload.businessId,
            task: task[0]._id,
            formatAddress: payload.formatAddress,
            position: payload.position,
            category: 'tenancy',
            details: {
              ...payload.verifications.tenancy.addressVerfication?.address,
              state: payload.verifications.tenancy.addressVerfication.address?.state?.toLowerCase(),
            },
            submissionExpectedAt: addHours(Date.now(), +48),
            cost: 0,
          },
        ],
        { session },
      );

      addressId = address[0]?._id;
    }
    if (payload.verifications.tenancy.employmentVerification) {
      const employment = await EmploymentVerificationModel.create(
        [
          {
            task: task[0]._id,
            business: business._id,
            candidate: payload.candidateId,
            type: payload?.verifications?.tenancy?.employmentVerification?.type,
            role: payload?.verifications?.tenancy?.employmentVerification?.role,
            address: payload?.verifications?.tenancy?.employmentVerification?.address,
            identity: {
              type: payload?.verifications?.tenancy?.employmentVerification?.identity?.type,
              number: payload?.verifications?.tenancy?.employmentVerification?.identity?.number,
            },
            companyName: payload?.verifications?.tenancy?.employmentVerification?.companyName,
            cost: 0,
          },
        ],
        { session },
      );

      employmentId = employment[0]?._id;
    }
    if (payload.verifications.tenancy.businessVerification) {
      const businessPartnership = await BusinessPartnershipModel.create(
        [
          {
            task: task[0]._id,
            business: business._id,
            candidate: payload.candidateId,
            businessName: payload?.verifications?.tenancy?.businessPartnership?.businessName,
            directorsNin: payload?.verifications?.tenancy?.businessPartnership?.directorsNin,
            address: payload?.verifications?.tenancy?.businessPartnership?.address,
            type: payload?.verifications?.tenancy?.businessPartnership?.type,
            certificateUrl: payload?.verifications?.tenancy?.businessPartnership?.certificateUrl,
            guarantor: payload?.verifications?.tenancy?.businessPartnership?.guarantor,
            cost: 0,
          },
        ],
        { session },
      );

      businessVerificationId = businessPartnership[0]?._id;
    }
    if (payload.verifications.tenancy.guarantorVerification) {
      const guarantor = await GuarantorVerificationModel.create(
        [
          {
            task: task[0]._id,
            business: business._id,
            candidate: payload.candidateId,
            name: payload?.verifications?.tenancy?.guarantorVerification?.name,
            addressType: payload?.verifications?.tenancy?.guarantorVerification?.addressType,
            address: payload?.verifications?.tenancy?.guarantorVerification?.address,
            type: payload?.verifications?.tenancy?.guarantorVerification?.type,
            certificateUrl: payload?.verifications?.tenancy?.guarantorVerification?.certificateUrl,
            nin: payload?.verifications?.tenancy?.guarantorVerification?.nin,
            phoneNumber: payload?.verifications?.tenancy?.guarantorVerification?.phoneNumber,
            email: payload?.verifications?.tenancy?.guarantorVerification?.email,
            questionaireUrl:
              payload?.verifications?.tenancy?.guarantorVerification?.questionaireUrl,
            attestationUrl: payload?.verifications?.tenancy?.guarantorVerification?.attestationUrl,
            cost: 0,
          },
        ],
        { session },
      );

      guarantorId = guarantor[0]?._id;
    }

    return await TenancyModel.create(
      [
        {
          task: task[0]._id,
          business: business._id,
          candidate: payload.candidateId,
          category: payload.verifications.tenancy.category,
          type: payload.verifications.tenancy.type,
          identityVerification: identityId,
          addressVerification: addressId,
          employmentVerification: employmentId,
          businessVerification: businessVerificationId,
          guarantorVerification: guarantorId,
          ownership: payload.verifications.tenancy.ownership,
          agency: payload.verifications.tenancy.agency,
          cost: costOfVerification['tenancy' as keyof typeof costOfVerification],
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createHouseholdVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const {
      AddressModel,
      EmploymentVerificationModel,
      HouseholdModel,
      GuarantorVerificationModel,
    } = this;

    let identityId;
    let addressId;
    let employmentId;
    let guarantorId;
    if (payload.verifications.household.identityVerification) {
      const identity = await this.createIdentityVerification(
        task,
        business,
        {
          candidate: payload.candidate,
          business: payload.business,
          task: task[0]._id,
          idNumber: payload.verifications.household.identityVerification.idNumber,
          idType: payload.verifications.household.identityVerification.type,
          status: payload?.responseStatus ? IdentityStatusEnum.VERIFIED : IdentityStatusEnum.FAILED,
          identityResponse: payload?.identityResponse,
          validationData: payload?.validationData,
          cost: 0,
        },
        costOfVerification,
        session,
      );

      identityId = identity[0]?._id;
    }
    if (payload.verifications.household.addressVerification) {
      const address = await AddressModel.create(
        [
          {
            candidate: payload.candidateId,
            business: payload.businessId,
            task: task[0]._id,
            formatAddress: payload.formatAddress,
            position: payload.position,
            category: 'household',
            details: {
              ...payload.verifications.household.addressVerfication?.address,
              state:
                payload.verifications.household.addressVerfication.address?.state?.toLowerCase(),
            },
            submissionExpectedAt: addHours(Date.now(), +48),
            cost: 0,
          },
        ],
        { session },
      );

      addressId = address[0]?._id;
    }
    if (payload.verifications.household.employmentVerification) {
      const employment = await EmploymentVerificationModel.create(
        [
          {
            task: task[0]._id,
            business: business._id,
            candidate: payload.candidateId,
            type: payload?.verifications?.household?.employmentVerification?.type,
            role: payload?.verifications?.household?.employmentVerification?.role,
            address: payload?.verifications?.household?.employmentVerification?.address,
            identity: {
              type: payload?.verifications?.household?.employmentVerification?.identity?.type,
              number: payload?.verifications?.household?.employmentVerification?.identity?.number,
            },
            companyName: payload?.verifications?.household?.employmentVerification?.companyName,
            cost: 0,
          },
        ],
        { session },
      );

      employmentId = employment[0]?._id;
    }

    if (payload.verifications.household.guarantorVerification) {
      const guarantor = await GuarantorVerificationModel.create(
        [
          {
            task: task[0]._id,
            business: business._id,
            candidate: payload.candidateId,
            name: payload?.verifications?.household?.guarantorVerification?.name,
            addressType: payload?.verifications?.household?.guarantorVerification?.addressType,
            address: payload?.verifications?.household?.guarantorVerification?.address,
            type: payload?.verifications?.household?.guarantorVerification?.type,
            certificateUrl:
              payload?.verifications?.household?.guarantorVerification?.certificateUrl,
            nin: payload?.verifications?.household?.guarantorVerification?.nin,
            phoneNumber: payload?.verifications?.household?.guarantorVerification?.phoneNumber,
            email: payload?.verifications?.household?.guarantorVerification?.email,
            questionaireUrl:
              payload?.verifications?.household?.guarantorVerification?.questionaireUrl,
            attestationUrl:
              payload?.verifications?.household?.guarantorVerification?.attestationUrl,
            cost: 0,
          },
        ],
        { session },
      );

      guarantorId = guarantor[0]?._id;
    }

    return await HouseholdModel.create(
      [
        {
          task: task[0]._id,
          business: business._id,
          candidate: payload.candidateId,
          identityVerification: identityId,
          addressVerification: addressId,
          employmentVerification: employmentId,
          guarantorVerification: guarantorId,
          ancestry: payload.verifications.household.ancestry,
          cost: costOfVerification['household' as keyof typeof costOfVerification],
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createBusinessVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const { BusinessVerificationModel, AddressModel } = this;

    const address = await AddressModel.create(
      [
        {
          candidate: payload.candidateId,
          business: payload.businessId,
          task: task[0]._id,
          formatAddress: payload.formatAddress,
          position: payload.position,
          category: CategoryEnum.BUSINESS,
          details: {
            ...payload.verifications.businessVerification.address,
            state: payload.verifications.businessVerification.address?.state?.toLowerCase(),
          },
          submissionExpectedAt: addHours(Date.now(), +48),
          cost: 0,
        },
      ],
      { session },
    );

    return await BusinessVerificationModel.create(
      [
        {
          task: task[0]._id,
          business: business._id,
          candidate: payload.candidateId,
          businessName: payload.verifications.businessVerification.businessName,
          address: address[0]?._id,
          cost: costOfVerification['business-verification' as keyof typeof costOfVerification],
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createIdentityVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const { IdentityModel } = this;

    return await IdentityModel.create(
      [
        {
          candidate: payload.candidate,
          business: payload.business,
          task: task[0]._id,
          idNumber: payload?.verifications?.identity?.idNumber || payload?.idNumber,
          idType: payload?.verifications?.identity?.type || payload?.idType,
          status: payload?.responseStatus ? IdentityStatusEnum.VERIFIED : IdentityStatusEnum.FAILED,
          identityResponse: payload?.identityResponse,
          validationData: payload?.validationData,
          cost: costOfVerification[
            payload?.verifications?.identity?.type ||
              (payload?.idType as string as keyof typeof costOfVerification)
          ],
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createDocumentVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const { DocumentModel } = this;

    return await DocumentModel.create(
      [
        {
          candidate: payload.candidateId,
          business: payload.businessId,
          task: task[0]._id,
          category: payload.verifications.documents.category,
          nameOfDocument: payload.verifications.documents.nameOfDocument,
          documentUrls: payload.verifications.documents.documentUrls,
          cost: costOfVerification['document-verifications' as keyof typeof costOfVerification],
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createAddressVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const { AddressModel } = this;

    const tatHours = ['lagos', 'lagos state'].includes(
      payload.verifications.address?.state?.toLowerCase() || '',
    )
      ? business?.tat.lagosAddress
      : business?.tat.address;

    return await AddressModel.create(
      [
        {
          candidate: payload.candidateId,
          business: payload.businessId,
          task: task[0]._id,
          formatAddress: payload.formatAddress,
          position: payload.position,
          category: 'individual',
          details: {
            ...payload.verifications.address,
            state: payload.verifications.address?.state?.toLowerCase(),
          },
          submissionExpectedAt: payload?.tat
            ? addHours(Date.now(), +payload.tat)
            : addHours(Date.now(), +tatHours),
          cost: costOfVerification['address' as keyof typeof costOfVerification],
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createBankStatementVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const { BankStatementModel } = this;

    return await BankStatementModel.create(
      [
        {
          candidate: payload.candidate,
          business: payload.business,
          task: task[0]._id,
          providerId: payload.verifications.bankStatement?.orderId,
          providerName: 'pay-arena',
          requestData: { orderId: payload.verifications.bankStatement?.orderId },
          responseData: payload?.bankStatementResponse,
          identityResponse: payload?.identityResponse,
          validationData: payload?.validationData,
          cost: costOfVerification['bank-statement' as keyof typeof costOfVerification],
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createAcademicVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const { AcademicDocumentModel } = this;

    return await AcademicDocumentModel.create(
      [
        {
          candidate: payload.candidateId,
          business: payload.businessId,
          task: task[0]._id,
          category: payload.verifications.academicDocuments.category,
          letterOfAuthorization: payload.verifications.academicDocuments.letterOfAuthorization,
          letterOfRequest: payload.verifications.academicDocuments.letterOfRequest,
          examinationBoard: payload.verifications.academicDocuments.examinationBoard,
          examNumber: payload.verifications.academicDocuments.examNumber,
          resultUrl: payload.verifications.academicDocuments.resultUrl,
          cost: costOfVerification['academic-documents' as keyof typeof costOfVerification],
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createProjectModelVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const { ProjectModel } = this;

    return await ProjectModel.create(
      [
        {
          task: task[0]._id,
          business: business._id,
          candidate: payload.candidateId,
          interval: payload?.verifications?.projectVerification?.interval,
          documents: payload?.verifications?.projectVerification?.documents,
          description: payload?.verifications?.projectVerification?.description,
          handlingType: payload?.verifications?.projectVerification?.handlingType,
          projectImageUrl: payload?.verifications?.projectVerification?.projectImageUrl,
          cost: costOfVerification['project-verification' as keyof typeof costOfVerification],
          letterOfAuthorizationImageUrl:
            payload?.verifications?.projectVerification?.letterOfAuthorizationImageUrl,
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createCriminalVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const { CriminalModel } = this;

    return await CriminalModel.create(
      [
        {
          task: task[0]._id,
          business: business._id,
          candidate: payload.candidateId,
          letterUrl: payload?.verifications?.criminal?.letterUrl,
          cost: costOfVerification['criminal' as keyof typeof costOfVerification],
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createBusinessPartnershipVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const { BusinessPartnershipModel } = this;

    return await BusinessPartnershipModel.create(
      [
        {
          task: task[0]._id,
          business: business._id,
          candidate: payload.candidateId,
          businessName: payload?.verifications?.businessPartnership?.businessName,
          directorsNin: payload?.verifications?.businessPartnership?.directorsNin,
          address: payload?.verifications?.businessPartnership?.address,
          type: payload?.verifications?.businessPartnership?.type,
          certificateUrl: payload?.verifications?.businessPartnership?.certificateUrl,
          guarantor: payload?.verifications?.businessPartnership?.guarantor,
          cost: costOfVerification['business-partnership' as keyof typeof costOfVerification],
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createMarriageVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const { MarriageModel } = this;

    return await MarriageModel.create(
      [
        {
          task: task[0]._id,
          business: business._id,
          candidate: payload.candidateId,
          letterUrl: payload?.verifications?.marriage?.letterUrl,
          type: payload?.verifications?.marriage?.type,
          category: payload?.verifications?.marriage?.category,
          images: payload?.verifications?.marriage?.images,
          certificateUrl: payload?.verifications?.marriage?.certificateUrl,
          cost: costOfVerification['marriage' as keyof typeof costOfVerification],
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createAmlVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const { AmlModel } = this;

    return await AmlModel.create(
      [
        {
          candidate: payload.candidate,
          business: payload.business,
          task: task[0]._id,
          status: IdentityStatusEnum.VERIFIED,
          cost: costOfVerification[
            payload?.verifications?.identity.type as string as keyof typeof costOfVerification
          ],
          sanctions: payload?.identityResponse?.sanctions,
          pep: payload?.identityResponse?.pep,
          crime: payload?.identityResponse?.crime,
          debarment: payload?.identityResponse?.debarment,
          financialServices: payload?.identityResponse?.financialServices,
          government: payload?.identityResponse?.government,
          role: payload?.identityResponse?.role,
          religion: payload?.identityResponse?.religion,
          military: payload?.identityResponse?.military,
          frozenAsset: payload?.identityResponse?.frozenAsset,
          personOfInterest: payload?.identityResponse?.personOfInterest,
          totalEntity: payload?.identityResponse?.totalEntity,
          categoryCount: payload?.identityResponse?.categoryCount,
          queriedWith: payload?.identityResponse?.queriedWith,
          query: payload?.identityResponse?.query,
          type: payload?.identityResponse?.sanctions,
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createEmploymentVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const { EmploymentVerificationModel } = this;

    return await EmploymentVerificationModel.create(
      [
        {
          task: task[0]._id,
          business: business._id,
          candidate: payload.candidateId,
          type: payload?.verifications?.employmentVerification?.type,
          role: payload?.verifications?.employmentVerification?.role,
          address: payload?.verifications?.employmentVerification?.address,
          identity: {
            type: payload?.verifications?.employmentVerification?.identity?.type,
            number: payload?.verifications?.employmentVerification?.identity?.number,
          },
          companyName: payload?.verifications?.employmentVerification?.companyName,
          cost: costOfVerification['employment-verification' as keyof typeof costOfVerification],
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createGuarantorVerification(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    task: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
  ) {
    const { GuarantorVerificationModel } = this;

    return await GuarantorVerificationModel.create(
      [
        {
          task: task[0]._id,
          business: business._id,
          candidate: payload.candidateId,
          name: payload?.verifications?.guarantorVerification?.name,
          addressType: payload?.verifications?.guarantorVerification?.addressType,
          address: payload?.verifications?.guarantorVerification?.address,
          type: payload?.verifications?.guarantorVerification?.type,
          certificateUrl: payload?.verifications?.guarantorVerification?.certificateUrl,
          nin: payload?.verifications?.guarantorVerification?.nin,
          phoneNumber: payload?.verifications?.guarantorVerification?.phoneNumber,
          email: payload?.verifications?.guarantorVerification?.email,
          questionaireUrl: payload?.verifications?.guarantorVerification?.questionaireUrl,
          attestationUrl: payload?.verifications?.guarantorVerification?.attestationUrl,
          cost: costOfVerification['guarantor-verification' as keyof typeof costOfVerification],
        },
      ],
      { session },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async chargeBusiness({
    taskId,
    taskUser,
    businessId,
    costOfVerification,
    service,
    entityType,
  }: {
    taskId: string;
    taskUser: string;
    businessId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costOfVerification: any;
    service: string;
    entityType: string;
  }) {
    const { TransactionDataAccess } = this;

    if (entityType === EntityEnum.CUSTOMER) {
      return;
    }

    await TransactionDataAccess.chargeBusiness(
      taskId,
      taskUser,
      businessId,
      costOfVerification[service as keyof typeof costOfVerification],
    );
  }
  async updateTaskIfCompleted(task: Record<string, unknown>) {
    const taskData = await this.fetchTaskByID(task._id as string);

    const allTaskCompleted = await CommonLogic.allTaskCompleted(taskData);

    if (!allTaskCompleted) {
      return;
    }

    this.updateTaskById(taskData._id, {
      completedAt: new Date(),
      status: StatusEnum.COMPLETED,
    });
  }

  async fetchLimitedVerifications(businessId: string, limit: number) {
    const { TaskModel } = this;

    return TaskModel.aggregate([
      {
        $match: {
          business: businessId,
        },
      },
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidate',
        },
      },
      {
        $lookup: {
          from: 'addresses',
          localField: '_id',
          foreignField: 'task',
          as: 'address',
        },
      },
      {
        $lookup: {
          from: 'identities',
          localField: '_id',
          foreignField: 'task',
          as: 'identity',
        },
      },
      {
        $lookup: {
          from: 'bankstatements',
          localField: '_id',
          foreignField: 'task',
          as: 'bankStatement',
        },
      },
      {
        $lookup: {
          from: 'businesspartnerships',
          localField: '_id',
          foreignField: 'task',
          as: 'businessPartnership',
        },
      },
      {
        $lookup: {
          from: 'academicdocuments',
          localField: '_id',
          foreignField: 'task',
          as: 'academicDocument',
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'task',
          as: 'project',
        },
      },
      {
        $lookup: {
          from: 'guarantorverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'guarantorVerification',
        },
      },
      {
        $lookup: {
          from: 'employmentverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'employmentVerification',
        },
      },
      {
        $lookup: {
          from: 'tenancyverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'tenancyVerification',
        },
      },
      {
        $lookup: {
          from: 'businessverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'businessVerification',
        },
      },
      {
        $lookup: {
          from: 'householdverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'householdVerification',
        },
      },
      {
        $lookup: {
          from: 'criminalrecords',
          localField: '_id',
          foreignField: 'task',
          as: 'criminalRecord',
        },
      },
      {
        $lookup: {
          from: 'marriageverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'marriageVerification',
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: limit,
      },
    ]);
  }

  async fetchLimitedAdminVerifications(limit: number) {
    const { TaskModel } = this;

    return TaskModel.aggregate([
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidate',
        },
      },
      {
        $lookup: {
          from: 'addresses',
          localField: '_id',
          foreignField: 'task',
          as: 'address',
        },
      },
      {
        $lookup: {
          from: 'identities',
          localField: '_id',
          foreignField: 'task',
          as: 'identity',
        },
      },
      {
        $lookup: {
          from: 'bankstatements',
          localField: '_id',
          foreignField: 'task',
          as: 'bankStatement',
        },
      },
      {
        $lookup: {
          from: 'businesspartnerships',
          localField: '_id',
          foreignField: 'task',
          as: 'businessPartnership',
        },
      },
      {
        $lookup: {
          from: 'academicDocuments',
          localField: '_id',
          foreignField: 'task',
          as: 'academicDocument',
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'task',
          as: 'project',
        },
      },
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: 'task',
          as: 'document',
        },
      },
      {
        $lookup: {
          from: 'guarantorverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'guarantorVerification',
        },
      },
      {
        $lookup: {
          from: 'employmentverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'employmentVerification',
        },
      },
      {
        $lookup: {
          from: 'marriageverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'marriageVerification',
        },
      },
      {
        $lookup: {
          from: 'criminalrecords',
          localField: '_id',
          foreignField: 'task',
          as: 'criminalVerification',
        },
      },
      {
        $lookup: {
          from: 'tenancyverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'tenancyVerification',
        },
      },
      {
        $lookup: {
          from: 'businessesverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'businessVerification',
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: limit,
      },
    ]);
  }

  async allBusinessVerifications(
    businessId: string,
    {
      period,
      status,
      type,
      search,
      customStartDate,
      customEndDate,
    }: {
      period: number;
      status: string;
      type: string;
      search: string;
      customStartDate: string;
      customEndDate: string;
    },
    { offset, limit }: { offset: number; limit: number },
  ) {
    const { TaskModel } = this;

    const stoppedDate = subDays(new Date(), period);
    const startDate = startOfDay(stoppedDate);

    return TaskModel.aggregate([
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidate',
        },
      },
      {
        $match: {
          business: businessId,
          ...(search
            ? {
                $or: [
                  { 'candidate.firstName': { $regex: new RegExp(search, 'i') } },
                  { 'candidate.lastName': { $regex: new RegExp(search, 'i') } },
                ],
              }
            : undefined),
          ...(type
            ? {
                verifications: type,
              }
            : undefined),
          ...(status ? { status } : undefined),
          ...(period && (!customStartDate || !customEndDate)
            ? {
                createdAt: {
                  $gte: startDate,
                  $lte: new Date(),
                },
              }
            : undefined),
          ...(customStartDate && customEndDate
            ? {
                createdAt: {
                  $gte: new Date(customStartDate),
                  $lte: endOfDay(new Date(customEndDate)),
                },
              }
            : undefined),
        },
      },
      {
        $lookup: {
          from: 'addresses',
          localField: '_id',
          foreignField: 'task',
          as: 'address',
        },
      },
      {
        $lookup: {
          from: 'identities',
          localField: '_id',
          foreignField: 'task',
          as: 'identity',
        },
      },
      {
        $lookup: {
          from: 'bankstatements',
          localField: '_id',
          foreignField: 'task',
          as: 'bankStatement',
        },
      },
      {
        $lookup: {
          from: 'businesspartnerships',
          localField: '_id',
          foreignField: 'task',
          as: 'businessPartnership',
        },
      },
      {
        $lookup: {
          from: 'academicDocuments',
          localField: '_id',
          foreignField: 'task',
          as: 'academicDocument',
        },
      },
      {
        $lookup: {
          from: 'guarantorverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'guarantorVerification',
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'task',
          as: 'project',
        },
      },
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: 'task',
          as: 'document',
        },
      },
      {
        $lookup: {
          from: 'employmentverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'employmentVerification',
        },
      },
      {
        $lookup: {
          from: 'criminalrecords',
          localField: '_id',
          foreignField: 'task',
          as: 'criminalVerification',
        },
      },
      {
        $lookup: {
          from: 'marriageverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'marriageVerification',
        },
      },
      {
        $lookup: {
          from: 'tenancyverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'tenancyVerification',
        },
      },
      {
        $lookup: {
          from: 'businessverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'businessVerification',
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }, { $addFields: { page: 1 } }],
          data: [{ $skip: offset }, { $limit: limit }],
        },
      },
    ]);
  }

  async allBusinessCandidatesVerifications(
    businessId: string,
    candidateId: string,
    {
      period,
      status,
      type,
      search,
      customStartDate,
      customEndDate,
    }: {
      period: number;
      status: string;
      type: string;
      search: string;
      customStartDate: string;
      customEndDate: string;
    },
    { offset, limit }: { offset: number; limit: number },
  ) {
    const { TaskModel } = this;

    const stoppedDate = subDays(new Date(), period);
    const startDate = startOfDay(stoppedDate);

    return TaskModel.aggregate([
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidate',
        },
      },
      {
        $match: {
          business: businessId,
          'candidate._id': new ObjectId(candidateId),
          ...(search
            ? {
                $or: [
                  { 'candidate.firstName': { $regex: new RegExp(search, 'i') } },
                  { 'candidate.lastName': { $regex: new RegExp(search, 'i') } },
                ],
              }
            : undefined),
          ...(type
            ? {
                verifications: type,
              }
            : undefined),
          ...(status ? { status } : undefined),
          ...(period && (!customStartDate || !customEndDate)
            ? {
                createdAt: {
                  $gte: startDate,
                  $lte: new Date(),
                },
              }
            : undefined),
          ...(customStartDate && customEndDate
            ? {
                createdAt: {
                  $gte: new Date(customStartDate),
                  $lte: endOfDay(new Date(customEndDate)),
                },
              }
            : undefined),
        },
      },
      {
        $lookup: {
          from: 'addresses',
          localField: '_id',
          foreignField: 'task',
          as: 'address',
        },
      },
      {
        $lookup: {
          from: 'identities',
          localField: '_id',
          foreignField: 'task',
          as: 'identity',
        },
      },
      {
        $lookup: {
          from: 'bankstatements',
          localField: '_id',
          foreignField: 'task',
          as: 'bankStatement',
        },
      },
      {
        $lookup: {
          from: 'businesspartnerships',
          localField: '_id',
          foreignField: 'task',
          as: 'businessPartnership',
        },
      },
      {
        $lookup: {
          from: 'guarantorverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'guarantorVerification',
        },
      },
      {
        $lookup: {
          from: 'academicdocuments',
          localField: '_id',
          foreignField: 'task',
          as: 'academicDocument',
        },
      },
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: 'task',
          as: 'document',
        },
      },
      {
        $lookup: {
          from: 'employmentverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'employmentVerification',
        },
      },
      {
        $lookup: {
          from: 'marriageverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'marriageVerification',
        },
      },
      {
        $lookup: {
          from: 'tenancyverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'tenancyVerification',
        },
      },
      {
        $lookup: {
          from: 'businessverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'businessVerification',
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }, { $addFields: { page: 1 } }],
          data: [{ $skip: offset }, { $limit: limit }],
        },
      },
    ]);
  }

  async allAdminVerifications(
    {
      period,
      status,
      type,
      search,
      customStartDate,
      customEndDate,
    }: {
      period: number;
      status: string;
      type: string;
      search: string;
      customStartDate: string;
      customEndDate: string;
    },
    { offset, limit }: { offset: number; limit: number },
  ) {
    const { TaskModel } = this;

    const stoppedDate = subDays(new Date(), period);
    const startDate = startOfDay(stoppedDate);

    return TaskModel.aggregate([
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidate',
        },
      },
      {
        $match: {
          ...(search
            ? {
                $or: [
                  { 'candidate.firstName': { $regex: new RegExp(search, 'i') } },
                  { 'candidate.lastName': { $regex: new RegExp(search, 'i') } },
                ],
              }
            : undefined),
          ...(type
            ? {
                verifications: type,
              }
            : undefined),
          ...(status ? { status } : undefined),
          ...(period && (!customStartDate || !customEndDate)
            ? {
                createdAt: {
                  $gte: startDate,
                  $lte: new Date(),
                },
              }
            : undefined),
          ...(customStartDate && customEndDate
            ? {
                createdAt: {
                  $gte: new Date(customStartDate),
                  $lte: endOfDay(new Date(customEndDate)),
                },
              }
            : undefined),
        },
      },
      {
        $lookup: {
          from: 'addresses',
          localField: '_id',
          foreignField: 'task',
          as: 'address',
        },
      },
      {
        $lookup: {
          from: 'identities',
          localField: '_id',
          foreignField: 'task',
          as: 'identity',
        },
      },
      {
        $lookup: {
          from: 'bankstatements',
          localField: '_id',
          foreignField: 'task',
          as: 'bankStatement',
        },
      },
      {
        $lookup: {
          from: 'businesspartnerships',
          localField: '_id',
          foreignField: 'task',
          as: 'businessPartnership',
        },
      },
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: 'task',
          as: 'document',
        },
      },
      {
        $lookup: {
          from: 'academicdocuments',
          localField: '_id',
          foreignField: 'task',
          as: 'academicDocument',
        },
      },
      {
        $lookup: {
          from: 'guarantorverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'guarantorVerification',
        },
      },
      {
        $lookup: {
          from: 'employmentverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'employmentVerification',
        },
      },
      {
        $lookup: {
          from: 'marriageverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'marriageVerification',
        },
      },
      {
        $lookup: {
          from: 'tenancyverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'tenancyVerification',
        },
      },
      {
        $lookup: {
          from: 'businessverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'businessVerification',
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }, { $addFields: { page: 1 } }],
          data: [{ $skip: offset }, { $limit: limit }],
        },
      },
    ]);
  }

  async allAdminOtherVerifications(
    {
      type,
      period,
      status,
      // entity,
      search,
      customEndDate,
      customStartDate,
    }: {
      type: string;
      period: number;
      status: string;
      search: string;
      entity: string;
      customStartDate: string;
      customEndDate: string;
    },
    { offset, limit }: { offset: number; limit: number },
  ) {
    const { TaskModel } = this;

    const stoppedDate = subDays(new Date(), period);
    const startDate = startOfDay(stoppedDate);

    return TaskModel.aggregate([
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidate',
        },
      },
      {
        $match: {
          ...(search
            ? {
                $or: [
                  { 'candidate.firstName': { $regex: new RegExp(search, 'i') } },
                  { 'candidate.lastName': { $regex: new RegExp(search, 'i') } },
                ],
              }
            : undefined),
          ...(type
            ? {
                verifications: type,
              }
            : undefined),
          ...(status ? { status } : undefined),
          // ...(entity ? { entity: EntityEnum.CUSTOMER } : undefined),

          ...(period && (!customStartDate || !customEndDate)
            ? {
                createdAt: {
                  $gte: startDate,
                  $lte: new Date(),
                },
              }
            : undefined),
          ...(customStartDate && customEndDate
            ? {
                createdAt: {
                  $gte: new Date(customStartDate),
                  $lte: endOfDay(new Date(customEndDate)),
                },
              }
            : undefined),
          verifications: {
            $nin: ['identity', 'address'],
          },
          // approvedByAdmin: false
        },
      },
      {
        $lookup: {
          from: 'addresses',
          localField: '_id',
          foreignField: 'task',
          as: 'address',
        },
      },
      {
        $lookup: {
          from: 'identities',
          localField: '_id',
          foreignField: 'task',
          as: 'identity',
        },
      },
      {
        $lookup: {
          from: 'bankstatements',
          localField: '_id',
          foreignField: 'task',
          as: 'bankStatement',
        },
      },
      {
        $lookup: {
          from: 'academicDocuments',
          localField: '_id',
          foreignField: 'task',
          as: 'certificateDocument',
        },
      },
      {
        $lookup: {
          from: 'guarantorverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'guarantorVerification',
        },
      },
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: 'task',
          as: 'document',
        },
      },
      {
        $lookup: {
          from: 'businesspartnerships',
          localField: '_id',
          foreignField: 'task',
          as: 'businessPartnership',
        },
      },
      {
        $lookup: {
          from: 'employmentverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'employmentVerification',
        },
      },
      {
        $lookup: {
          from: 'marriageverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'marriageVerification',
        },
      },
      {
        $lookup: {
          from: 'tenancyverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'tenancyVerification',
        },
      },
      {
        $lookup: {
          from: 'businessverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'businessVerification',
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }, { $addFields: { page: 1 } }],
          data: [{ $skip: offset }, { $limit: limit }],
        },
      },
    ]);
  }

  async exportAdminVerifications({
    period,
    status,
    type,
    search,
    businessId,
    customStartDate,
    customEndDate,
  }: {
    period: number;
    status: string;
    type: string;
    search: string;
    businessId: string;
    customStartDate: string;
    customEndDate: string;
  }) {
    const { TaskModel } = this;

    const stoppedDate = subDays(new Date(), period);
    const startDate = startOfDay(stoppedDate);

    return TaskModel.aggregate([
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidate',
        },
      },
      {
        $lookup: {
          from: 'businesses',
          localField: 'business',
          foreignField: '_id',
          as: 'business',
        },
      },
      {
        $match: {
          ...(search
            ? {
                $or: [
                  { 'candidate.firstName': { $regex: new RegExp(search, 'i') } },
                  { 'candidate.lastName': { $regex: new RegExp(search, 'i') } },
                ],
              }
            : undefined),
          ...(type
            ? {
                verifications: type,
              }
            : undefined),
          ...(status ? { status } : undefined),
          ...(businessId ? { business: businessId } : undefined),
          ...(period && (!customStartDate || !customEndDate)
            ? {
                createdAt: {
                  $gte: startDate,
                  $lte: new Date(),
                },
              }
            : undefined),
          ...(customStartDate && customEndDate
            ? {
                createdAt: {
                  $gte: new Date(customStartDate),
                  $lte: endOfDay(new Date(customEndDate)),
                },
              }
            : undefined),
        },
      },
      {
        $lookup: {
          from: 'addresses',
          localField: '_id',
          foreignField: 'task',
          as: 'address',
        },
      },
      {
        $lookup: {
          from: 'identities',
          localField: '_id',
          foreignField: 'task',
          as: 'identity',
        },
      },
      {
        $lookup: {
          from: 'bankstatements',
          localField: '_id',
          foreignField: 'task',
          as: 'bankStatement',
        },
      },
      {
        $lookup: {
          from: 'academicDocuments',
          localField: '_id',
          foreignField: 'task',
          as: 'certificateDocument',
        },
      },
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: 'task',
          as: 'document',
        },
      },
      {
        $lookup: {
          from: 'academicdocuments',
          localField: '_id',
          foreignField: 'task',
          as: 'academicDocument',
        },
      },
      {
        $lookup: {
          from: 'businesspartnerships',
          localField: '_id',
          foreignField: 'task',
          as: 'businessPartnership',
        },
      },
      {
        $lookup: {
          from: 'guarantorverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'guarantorVerification',
        },
      },
      {
        $lookup: {
          from: 'employmentverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'employmentVerification',
        },
      },
      {
        $lookup: {
          from: 'marriageverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'marriageVerification',
        },
      },
      {
        $lookup: {
          from: 'tenancyverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'tenancyVerification',
        },
      },
      {
        $lookup: {
          from: 'businessverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'businessVerification',
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);
  }

  async fetchTaskByCandidateId(
    candidateId: string,
    businessId: string,
    { offset, limit }: { offset: number; limit: number },
  ) {
    const { TaskModel } = this;

    return TaskModel.aggregate([
      {
        $match: {
          candidate: new ObjectId(candidateId),
          business: new ObjectId(businessId),
        },
      },
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidate',
        },
      },
      {
        $lookup: {
          from: 'addresses',
          localField: '_id',
          foreignField: 'task',
          as: 'address',
        },
      },
      {
        $lookup: {
          from: 'identities',
          localField: '_id',
          foreignField: 'task',
          as: 'identity',
        },
      },
      {
        $lookup: {
          from: 'bankstatements',
          localField: '_id',
          foreignField: 'task',
          as: 'bankStatement',
        },
      },
      {
        $lookup: {
          from: 'academicDocuments',
          localField: '_id',
          foreignField: 'task',
          as: 'certificateDocument',
        },
      },
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: 'task',
          as: 'document',
        },
      },
      {
        $lookup: {
          from: 'academicdocuments',
          localField: '_id',
          foreignField: 'task',
          as: 'academicDocument',
        },
      },
      {
        $lookup: {
          from: 'businesspartnerships',
          localField: '_id',
          foreignField: 'task',
          as: 'businessPartnership',
        },
      },
      {
        $lookup: {
          from: 'guarantorverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'guarantorVerification',
        },
      },
      {
        $lookup: {
          from: 'employmentverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'employmentVerification',
        },
      },
      {
        $lookup: {
          from: 'marriageverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'marriageVerification',
        },
      },
      {
        $lookup: {
          from: 'tenancyverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'tenancyVerification',
        },
      },
      {
        $lookup: {
          from: 'businessverifications',
          localField: '_id',
          foreignField: 'task',
          as: 'businessVerification',
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }, { $addFields: { page: 1 } }],
          data: [{ $skip: offset }, { $limit: limit }],
        },
      },
    ]);
  }

  async fetchTaskByID(id: string) {
    const { TaskModel } = this;

    return TaskModel.findById(id)
      .populate('business')
      .populate('candidate')
      .populate('identity')
      .populate('address')
      .populate('bankStatement')
      .populate('document')
      .populate('project')
      .populate('academicCertificate')
      .populate('businessPartnership')
      .populate('guarantorVerification')
      .populate('employmentVerification')
      .populate({
        path: 'businessVerification',
        populate: {
          path: 'address',
        },
      })
      .populate({
        path: 'tenancyVerification',
        populate: [{ path: 'addressVerification' }, { path: 'identityVerification' }],
      })
      .populate({
        path: 'householdVerification',
        populate: [{ path: 'addressVerification' }, { path: 'identityVerification' }],
      })
      .lean()
      .exec();
  }

  async getTaskByBusinessAndCandidate({
    business,
    candidate,
    verification,
  }: {
    business: string;
    candidate: string;
    verification: string;
  }) {
    const { TaskModel } = this;

    return TaskModel.findOne({ business, candidate, verifications: verification }).lean().exec();
  }

  async fetchTaskByBusinessCandidateID(businessId: string, candidateId: string) {
    const { TaskModel } = this;

    return TaskModel.find({
      business: businessId,
      candidate: candidateId,
    })
      .populate('business')
      .populate('candidate')
      .populate('identity')
      .populate('address')
      .populate('bankStatement')
      .populate('document')
      .populate('project')
      .populate('academicCertificate')
      .populate('businessPartnership')
      .populate('guarantorVerification')
      .populate('employmentVerification')
      .populate({
        path: 'businessVerification',
        populate: {
          path: 'address',
        },
      })
      .populate({
        path: 'tenancyVerification',
        populate: {
          path: 'addressVerification',
        },
      })
      .populate({
        path: 'householdVerification',
        populate: {
          path: 'addressVerification',
        },
      })
      .lean()
      .exec();
  }

  async fetchTaskByIdAndBusinessID(businessId: string, taskId: string) {
    const { TaskModel } = this;

    return TaskModel.findOne({
      business: businessId,
      _id: taskId,
    })
      .populate('business')
      .populate('candidate')
      .populate('identity')
      .populate('address')
      .populate('bankStatement')
      .populate('document')
      .populate('project')
      .populate('academicCertificate')
      .populate('businessPartnership')
      .populate('guarantorVerification')
      .populate('employmentVerification')
      .populate({
        path: 'businessVerification',
        populate: {
          path: 'address',
        },
      })
      .populate({
        path: 'tenancyVerification',
        populate: {
          path: 'addressVerification',
        },
      })
      .populate({
        path: 'householdVerification',
        populate: {
          path: 'addressVerification',
        },
      })
      .lean()
      .exec();
  }

  async countAllBusinessVerifications(businessId: string) {
    const { TaskModel } = this;

    return TaskModel.countDocuments({
      business: businessId,
    });
  }

  async businessDashboardMetrics(businessId: string, query: Record<string, string | number>) {
    const { TaskModel } = this;

    const { customEndDate, customStartDate } = query;

    return TaskModel.aggregate([
      {
        $match: {
          business: new ObjectId(businessId),
          ...(customEndDate && customStartDate
            ? {
                createdAt: {
                  $gte: startOfDay(customStartDate),
                  $lte: endOfDay(customEndDate),
                },
              }
            : undefined),
        },
      },
      {
        $group: {
          _id: null,
          totalCandidateSet: { $addToSet: '$candidate' },
          totalVerifications: { $sum: 1 },
          totalCompleted: {
            $sum: {
              $cond: {
                if: {
                  $eq: ['$status', StatusEnum.COMPLETED],
                },
                then: 1,
                else: 0,
              },
            },
          },
          totalPending: {
            $sum: {
              $cond: {
                if: {
                  $eq: ['$status', StatusEnum.PENDING],
                },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalVerifications: 1,
          totalCompleted: 1,
          totalPending: 1,
          totalCandidates: { $size: '$totalCandidateSet' }, // Count unique candidateId values
        },
      },
    ]);
  }

  async adminDashboardMetrics(query: Record<string, string | number>) {
    const { TaskModel } = this;

    const { customEndDate, customStartDate } = query;

    return TaskModel.aggregate([
      {
        $match: {
          ...(customEndDate && customStartDate
            ? {
                createdAt: {
                  $gte: startOfDay(customStartDate),
                  $lte: endOfDay(customEndDate),
                },
              }
            : undefined),
        },
      },
      {
        $group: {
          _id: null,
          totalVerifications: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: {
                if: {
                  $eq: ['$status', StatusEnum.COMPLETED],
                },
                then: '$cost',
                else: 0,
              },
            },
          },
          totalCompleted: {
            $sum: {
              $cond: {
                if: {
                  $eq: ['$status', StatusEnum.COMPLETED],
                },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalVerifications: 1,
          revenue: 1,
          totalCompleted: 1,
        },
      },
    ]);
  }

  async updateTaskById(
    id: string,
    setData: Record<string, unknown>,
    unsetData?: Record<string, unknown>,
  ) {
    const { TaskModel, fillable } = this;

    return TaskModel.findByIdAndUpdate(
      id,
      {
        ...(setData
          ? {
              $set: setData,
            }
          : undefined),
        ...(unsetData
          ? {
              $unset: unsetData,
            }
          : undefined),
      },
      {
        new: true,
      },
    )
      .select(fillable)
      .lean()
      .exec();
  }

  async allOtherVerifications(
    {
      status,
      reviewStatus,
      type,
      customStartDate,
      customEndDate,
      tat,
      underTat,
    }: {
      period: number;
      status: string;
      reviewStatus: string;
      type: string;
      search: string;
      customStartDate: string;
      customEndDate: string;
      tat: string;
      underTat: string;
    },
    { offset, limit }: { offset: number; limit: number },
  ) {
    const { TaskModel } = this;

    return TaskModel.aggregate([
      {
        $match: {
          verifications: {
            $nin: ['address', 'identity'],
          },
          ...(type
            ? {
                verifications: type,
              }
            : undefined),
          ...(!reviewStatus && status && !Array.isArray(status) ? { status } : undefined),
          ...(!reviewStatus && status && Array.isArray(status)
            ? { status: { $in: status } }
            : undefined),
          ...(reviewStatus
            ? {
                'approver.status': { $in: reviewStatus },
                status: { $in: [AddressStatusEnum.VERIFIED, AddressStatusEnum.FAILED] },
              }
            : undefined),
          ...(tat ? { createdAt: { $in: reviewStatus } } : undefined),
          ...(underTat && underTat === 'yes'
            ? { submissionExpectedAt: { $gte: new Date() }, status: AddressStatusEnum.CREATED }
            : undefined),
          ...(underTat && underTat === 'no'
            ? { submissionExpectedAt: { $lte: new Date() }, status: AddressStatusEnum.CREATED }
            : undefined),
          ...(customStartDate && customEndDate
            ? {
                createdAt: {
                  $gte: new Date(customStartDate),
                  $lte: endOfDay(new Date(customEndDate)),
                },
              }
            : undefined),
        },
      },
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidate',
        },
      },
      {
        $lookup: {
          from: 'tasks',
          localField: 'task',
          foreignField: '_id',
          as: 'task',
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }, { $addFields: { page: 1 } }],
          data: [{ $skip: offset }, { $limit: limit }],
        },
      },
    ]);
  }

  async updateChildEntity(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    verification: any,
    responseObject: Record<string, unknown>,
    user: unknown,
    status: string,
  ) {
    const {
      DocumentModel,
      ProjectModel,
      AcademicDocumentModel,
      BusinessPartnershipModel,
      GuarantorVerificationModel,
      EmploymentVerificationModel,
      BusinessVerificationModel,
      TenancyModel,
      HouseholdModel,
    } = this;

    for (const verificationType of verification.verifications) {
      switch (verificationType) {
        case VerificationSlugEnum.DOCUMENT:
          await DocumentModel.findByIdAndUpdate(verification?.documents?._id, {
            $set: { responsePayload: { ...responseObject }, verifier: user },
          });
          break;
        case VerificationSlugEnum.PROJECT:
          await ProjectModel.findByIdAndUpdate(verification?.projectVerification?._id, {
            $set: { responsePayload: { ...responseObject }, verifier: user },
          });
          break;
        case VerificationSlugEnum.ACADEMIC:
          await AcademicDocumentModel.findByIdAndUpdate(verification?.academicDocuments?._id, {
            $set: { responsePayload: { ...responseObject }, verifier: user },
          });
          break;
        case VerificationSlugEnum.BUSINESS_PARTNERSHIP:
          await BusinessPartnershipModel.findByIdAndUpdate(verification?.businessPartnership?._id, {
            $set: { responsePayload: { ...responseObject }, verifier: user },
          });
          break;
        case VerificationSlugEnum.GUARANTOR:
          await GuarantorVerificationModel.findByIdAndUpdate(
            verification?.guarantorVerification?._id,
            { $set: { responsePayload: { ...responseObject }, verifier: user } },
          );
          break;
        case VerificationSlugEnum.EMPLOYMENT:
          await EmploymentVerificationModel.findByIdAndUpdate(
            verification?.employmentVerification?._id,
            { $set: { responsePayload: { ...responseObject }, verifier: user } },
          );
          break;
        case VerificationSlugEnum.BUSINESS_VERIFICATION:
          await BusinessVerificationModel.findByIdAndUpdate(
            verification?.businessVerification?._id,
            { $set: { responsePayload: { ...responseObject }, verifier: user, status } },
          );
          break;
        case VerificationSlugEnum.TENANCY:
          await TenancyModel.findByIdAndUpdate(verification?.tenancyVerification?._id, {
            $set: { responsePayload: { ...responseObject }, verifier: user },
          });
          break;
        case VerificationSlugEnum.HOUSEHOLD:
          await HouseholdModel.findByIdAndUpdate(verification?.householdVerification?._id, {
            $set: { responsePayload: { ...responseObject }, verifier: user },
          });
          break;
        default:
          break;
      }
    }
  }
}
