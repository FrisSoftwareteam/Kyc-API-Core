import { route, before, POST } from 'awilix-express';
import { Request, Response } from 'express';
import {
  userLoginSchema,
  UserLoginInput,
  googleLoginSchema,
  GoogleLoginInput,
  forgotPasswordSchema,
  ForgotPasswordInput,
  resetPasswordSchema,
  ResetPasswordInput,
  refreshAccessTokenSchema,
  RefreshAccessTokenInput,
} from '../schemas/auth.schema';
import { validate } from '../middlewares/validate.middleware';
import ResponseTransformer from '../utils/response.transformer';
import { UserType } from '../constants';

@route('/auth')
export default class AuthController {
  private readonly AuthService;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ AuthService }: any) {
    this.AuthService = AuthService;
  }

  @POST()
  @route('/login')
  @before([validate(userLoginSchema)])
  async loginUser(req: Request, res: Response) {
    const { AuthService } = this;

    const data = await AuthService.loginUser(req.body as UserLoginInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/business-login')
  @before([validate(userLoginSchema)])
  async businessLoginUser(req: Request, res: Response) {
    const { AuthService } = this;

    const data = await AuthService.loginUser(req.body as UserLoginInput, UserType.BUSINESS);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/admin-login')
  @before([validate(userLoginSchema)])
  async adminLoginUser(req: Request, res: Response) {
    const { AuthService } = this;

    const data = await AuthService.loginUser(req.body as UserLoginInput, UserType.ADMINISTRATOR);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/partner-login')
  @before([validate(userLoginSchema)])
  async partnerLoginUser(req: Request, res: Response) {
    const { AuthService } = this;

    const data = await AuthService.loginUser(req.body as UserLoginInput, UserType.PARTNER);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/admin-google-login')
  @before([validate(googleLoginSchema)])
  async adminGoogleLogin(req: Request, res: Response) {
    const { AuthService } = this;

    const data = await AuthService.googleLogin(req.body as GoogleLoginInput, UserType.ADMINISTRATOR);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/business-google-login')
  @before([validate(googleLoginSchema)])
  async businessGoogleLogin(req: Request, res: Response) {
    const { AuthService } = this;

    const data = await AuthService.googleLogin(req.body as GoogleLoginInput, UserType.BUSINESS);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/partner-google-login')
  @before([validate(googleLoginSchema)])
  async partnerGoogleLogin(req: Request, res: Response) {
    const { AuthService } = this;

    const data = await AuthService.googleLogin(req.body as GoogleLoginInput, UserType.PARTNER);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/agent-login')
  @before([validate(userLoginSchema)])
  async agentLoginUser(req: Request, res: Response) {
    const { AuthService } = this;

    const data = await AuthService.loginUser(req.body as UserLoginInput, UserType.AGENT);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/forgot-password')
  @before([validate(forgotPasswordSchema)])
  async forgotPassword(req: Request, res: Response) {
    const { AuthService } = this;

    const data = await AuthService.forgotPassword(req.body as ForgotPasswordInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/reset-password')
  @before([validate(resetPasswordSchema)])
  async resetPassword(req: Request, res: Response) {
    const { AuthService } = this;

    const data = await AuthService.resetPassword(req.body as ResetPasswordInput);

    ResponseTransformer.success({ res, data });
  }

  @POST()
  @route('/refresh-token')
  @before([validate(refreshAccessTokenSchema)])
  async refreshAccessToken(req: Request, res: Response) {
    const { AuthService } = this;

    const data = await AuthService.refreshAccessToken(req.body as RefreshAccessTokenInput);

    return ResponseTransformer.success({ res, data });
  }
}
