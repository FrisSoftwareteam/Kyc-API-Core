import { route, before, POST } from 'awilix-express';
import { Request, Response } from 'express';
import {
  createBvnVerificationSchema,
  CreateNinVerificationInput,
  createPassportVerificationSchema,
  CreatePassportVerificationInput,
  createDriverLicenseVerificationSchema,
  CreateDriverLicenseVerificationInput,
  createPayArenaOrderSchema,
  CreatePayArenaOrderInput,
  fetchIdentityRealTimeSchema,
} from '../schemas/identity.schema';
import { validate } from '../middlewares/validate.middleware';
import { walletEnquiry } from '../middlewares/wallet.enquiry.middleware';
import ResponseTransformer from '../utils/response.transformer';
import { IIdentityServiceType } from '../models/provider.model';

@route('/identities')
export default class IdentityController {
  private readonly BusinessService;
  private readonly IdentityService;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ IdentityService, BusinessService }: any) {
    this.BusinessService = BusinessService;
    this.IdentityService = IdentityService;
  }

  @POST()
  @route('/bvn')
  @before([validate(createBvnVerificationSchema), walletEnquiry('bvn')])
  async verifyBvnIdentity(req: Request, res: Response) {
    const { BusinessService } = this;

    const data = await BusinessService.createBusinessIndividualIdentity(
      req.body as CreateNinVerificationInput,
      IIdentityServiceType.BVN,
    );

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/nin')
  @before([validate(createBvnVerificationSchema), walletEnquiry('nin')])
  async verifyNinIdentity(req: Request, res: Response) {
    const { BusinessService } = this;

    const data = await BusinessService.createBusinessIndividualIdentity(
      req.body as CreateNinVerificationInput,
      IIdentityServiceType.NIN,
    );

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/international-passport')
  @before([validate(createPassportVerificationSchema), walletEnquiry('internatonal-passport')])
  async verifyPassportIdentity(req: Request, res: Response) {
    const { BusinessService } = this;

    const data = await BusinessService.createBusinessIndividualIdentity(
      req.body as CreatePassportVerificationInput,
      IIdentityServiceType.PASSPORT,
    );

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/driver-license')
  @before([validate(createDriverLicenseVerificationSchema), walletEnquiry('driver-license')])
  async verifyDriverLicenseIdentity(req: Request, res: Response) {
    const { BusinessService } = this;

    const data = await BusinessService.createBusinessIndividualIdentity(
      req.body as CreateDriverLicenseVerificationInput,
      IIdentityServiceType.DL,
    );

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/pay-arena/get-order')
  @before([validate(createPayArenaOrderSchema)])
  async createPayArenaOrder(req: Request, res: Response) {
    const { BusinessService } = this;

    const data = await BusinessService.getPayArenaOrder(req.body as CreatePayArenaOrderInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/validate')
  @before([validate(fetchIdentityRealTimeSchema)])
  async fetchIdentityResponse(req: Request, res: Response) {
    const { BusinessService } = this;

    const data = await BusinessService.requestIdentity(req.body.type, req.body.id, 'NG');

    ResponseTransformer.success({
      res,
      data: {
        firstName: data?.firstName,
        lastName: data?.lastName,
        status: data?.status,
      },
    });
  }
}
