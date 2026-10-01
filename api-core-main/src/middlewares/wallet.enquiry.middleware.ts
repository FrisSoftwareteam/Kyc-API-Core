import { Request, Response, NextFunction } from 'express';
import { inject } from 'awilix-express';
import { BadRequestError } from '../errors/api.error';
import ResponseTransformer from '../utils/response.transformer';

export const walletEnquiry = (serviceSlug: string) =>
  inject(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ logger, BusinessService, ServiceDataAccess }: any) =>
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const service = await ServiceDataAccess.findServiceBySlug(serviceSlug);

          if (!service) {
            const error = new BadRequestError('Invalid Service Slug', {
              code: 'INVALID_SERVICE_SLUG',
            });

            return ResponseTransformer.error({ res, error });
          }

          const businessId = req.body.businessId;

          if (!businessId) {
            const error = new BadRequestError('Invalid Business ID', {
              code: 'INVALID_BUSINESS_ID',
            });

            return ResponseTransformer.error({ res, error });
          }

          const business = await BusinessService.getBusinessServices(businessId);

          if (!business) {
            const error = new BadRequestError('Invalid Business Data', {
              code: 'INVALID_BUSINESS_DATA',
            });

            return ResponseTransformer.error({ res, error });
          }

          if (service.price > (business?.wallet?.balance || 0)) {
            // const error = new BadRequestError('Wallet Balance too low', {
            //   code: 'LOW_WALLET_BALANCE',
            // });
            // return ResponseTransformer.error({ res, error });
          }

          next();
        } catch (error) {
          logger.error(JSON.stringify(error));
          return res.status(400).json({
            success: false,
            message: 'Wallet Enquiry Errors',
            errors: error,
          });
        }
      },
  );
