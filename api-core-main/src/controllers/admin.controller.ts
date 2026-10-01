import { route, before, POST, GET, PUT } from 'awilix-express';
import { Request, Response } from 'express';
import {
  CreateAdminInput,
  SuspendUserInput,
  RestoreUserInput,
  AttachRolesInput,
  createAdminSchema,
  suspendUserSchema,
  restoreUserSchema,
  attachRolesSchema,
  DisablePartnerInput,
  ApproveAddressInput,
  DisableBusinessInput,
  disablePartnerSchema,
  approveAddressSchema,
  disableBusinessSchema,
  RejectVerificationInput,
  SendTaskToVerifierInput,
  sendTaskToVerifierSchema,
  FundBusinessAccountInput,
  rejectVerificationSchema,
  ChangeAdminPasswordInput,
  fundBusinessAccountSchema,
  changeAdminPasswordSchema,
  UpdateAddressPartnerInput,
  updateAddressPartnerSchema,
  CreateBusinessServiceInput,
  UnflaggedVerificationInput,
  createBusinessServiceSchema,
  unflaggedVerificationSchema,
  AttachPartnerToAddressesInput,
  ApproveOtherVerificationInput,
  attachPartnerToAddressesSchema,
  ApproveCustomerVerificationInput,
  approveCustomerVerificationSchema,
  approveOtherVerificationSchema,
  SubmitVerifierVerificationTaskInput,
  submitVerifierVerificationTaskSchema,
} from '../schemas/admin.schema';
import { validate } from '../middlewares/validate.middleware';
import ResponseTransformer from '../utils/response.transformer';
import { BadRequestError } from '../errors/api.error';
import { IAwilixAdminController } from '../types/containers/admin.container';

@route('/admin')
export default class AdminController {
  private readonly AdminService;
  private readonly BusinessService;
  private readonly RabbitMqService;

  constructor({ AdminService, BusinessService, RabbitMqService }: IAwilixAdminController) {
    this.AdminService = AdminService;
    this.BusinessService = BusinessService;
    this.RabbitMqService = RabbitMqService;
  }

  @POST()
  @route('/create')
  @before([validate(createAdminSchema)])
  async createAdmin(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.createAdmin(req.body as CreateAdminInput);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/dashboard-metrics')
  async dashboardMetrics(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.dashboardMetrics(req.query);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/users')
  async adminUsers(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.adminUsers(req.query);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/roles')
  async getAdminRoles(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.getAdminRoles();

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/:adminId/profile')
  async adminProfile(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.adminProfile(req.params.adminId);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/businesses/:businessId/business-metrics')
  async businessMetrics(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.businessMetrics(req.params.businessId);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/partners/:partnerId/partner-metrics')
  async partnerMetrics(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.partnerMetrics(req.params.partnerId);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/businesses/:businessId/services')
  async businessServices(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.businessServices(req.params.businessId);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/businesses/:businessId/verifications')
  async businessVerifications(req: Request, res: Response) {
    const { BusinessService } = this;

    const data = await BusinessService.allVerifications(req.params.businessId, req.query);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/suspend-user')
  @before([validate(suspendUserSchema)])
  async suspendBusinessUser(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.suspendAdminUser(req.body as SuspendUserInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/restore-user')
  @before([validate(restoreUserSchema)])
  async restorePartnerUser(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.restoreAdminUser(req.body as RestoreUserInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/upsert-roles')
  @before([validate(attachRolesSchema)])
  async attachRole(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.attachRole(req.body as AttachRolesInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/disable-business')
  @before([validate(disableBusinessSchema)])
  async disableBusiness(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.disableBusiness(req.body as DisableBusinessInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/disable-partner')
  @before([validate(disablePartnerSchema)])
  async disablePartner(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.disablePartner(req.body as DisablePartnerInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/restore-business')
  @before([validate(disableBusinessSchema)])
  async restoreBusiness(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.restoreBusiness(req.body as DisableBusinessInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/restore-partner')
  @before([validate(disablePartnerSchema)])
  async restorePartner(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.restorePartner(req.body as DisablePartnerInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/businesses/services')
  @before([validate(createBusinessServiceSchema)])
  async upsertBusinessServices(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.upsertBusinessServices(req.body as CreateBusinessServiceInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/businesses/fund-account')
  @before([validate(fundBusinessAccountSchema)])
  async fundBusinessAccount(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.fundBusinessAccount(req.body as FundBusinessAccountInput);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/trendings')
  async dashboardTrendings(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.dashboardTrendings(req.query);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/verifications')
  async verifications(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.verifications(req.query);

    ResponseTransformer.success({ res, data });
  }

  // @GET()
  // @route('/verifications/others')
  // async otherVerifications(req: Request, res: Response) {
  //   const { AdminService } = this;
  //
  //   const data = await AdminService.otherVerifications(req.query);
  //
  //   ResponseTransformer.success({ res, data });
  // }

  @GET()
  @route('/verifications/addresses')
  async verificationAddresses(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.verificationAddresses(req.query);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/verifications/others')
  async verificationOthers(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.verificationOthers(req.query);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/verifications/export')
  async exportVerifications(req: Request, res: Response) {
    const { RabbitMqService } = this;

    if (!req.query.userId) {
      throw new BadRequestError('User ID missing on query', { code: 'USER_NOT_FOUND' });
    }

    RabbitMqService.publishToExportVerificationQueue(req.query);

    ResponseTransformer.success({
      res,
      data: 'Request Recieved Successfully, an attachment will be sent to your email',
    });
  }

  @GET()
  @route('/addresses/:addressId')
  async getAddressByAddressId(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.getAddressByAddressId(req.params.addressId);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/verifications/addresses/metrics')
  async addressMetrics(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.addressMetrics();

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/partners/:partnerId/addresses/:addressId/agents/all')
  async partnerAgentsAll(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.partnerAgentsAll(req.params.partnerId, req.params.addressId);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/verifications/addresses/:addressId/partners')
  async addressPartnersByState(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.addressPartnersByState(req.params.addressId);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/verifications/addresses/approved')
  @before([validate(approveAddressSchema)])
  async approvedAddress(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.approvedAddress(req.body as ApproveAddressInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/verifications/customer/status')
  @before([validate(approveCustomerVerificationSchema)])
  async approvedCustomerVerification(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.approvedCustomerVerification(
      req.body as ApproveCustomerVerificationInput,
    );

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/addresses/partners/attach')
  @before([validate(attachPartnerToAddressesSchema)])
  async attachPartnerToAddresses(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.attachPartnerToAddresses(
      req.body as AttachPartnerToAddressesInput,
    );

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/other-verifications/approve')
  @before([validate(approveOtherVerificationSchema)])
  async approveOtherVerification(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.approveOtherVerification(
      req.body as ApproveOtherVerificationInput,
    );

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/verifications/addresses/unflagged')
  @before([validate(unflaggedVerificationSchema)])
  async unflaggedAddress(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.unflaggedAddress(req.body as UnflaggedVerificationInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/verifications/addresses/reject')
  @before([validate(rejectVerificationSchema)])
  async rejectAddress(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.rejectAddress(req.body as RejectVerificationInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/addresses/partners')
  @before([validate(updateAddressPartnerSchema)])
  async updateAddressPartner(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.updateAddressPartner(req.body as UpdateAddressPartnerInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/verifier/send-mail')
  @before([validate(sendTaskToVerifierSchema)])
  async sendTaskToVerifier(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.sendTaskToVerifier(req.body as SendTaskToVerifierInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/verifier/submit-verification')
  @before([validate(submitVerifierVerificationTaskSchema)])
  async submitVerifierVerification(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.submitVerifierVerification(
      req.body as SubmitVerifierVerificationTaskInput,
    );

    ResponseTransformer.success({ res, data });
  }

  @PUT()
  @route('/change-password')
  @before([validate(changeAdminPasswordSchema)])
  async changeAdminUserPassword(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.changeAdminUserPassword(req.body as ChangeAdminPasswordInput);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/verifications/metrics')
  async verificationMetrics(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.verificationMetrics(req.query);

    ResponseTransformer.success({ res, data });
  }

  @GET()
  @route('/verifications/:verificationId')
  async partnerVerificationById(req: Request, res: Response) {
    const { AdminService } = this;

    const data = await AdminService.adminVerificationById(req.params as Record<string, unknown>);

    ResponseTransformer.success({ res, data });
  }
}
