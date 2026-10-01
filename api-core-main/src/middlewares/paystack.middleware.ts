import { Request, Response, NextFunction } from 'express';
import { inject } from 'awilix-express';
import crypto from 'crypto';
import { ForbiddenError } from '../errors/api.error';
import ResponseTransformer from '../utils/response.transformer';
import logger from '../core/Logger';

export const paystackAuthenticate = inject(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ config }: any) =>
    (req: Request, res: Response, next: NextFunction) => {
      const hash = crypto
        .createHmac('sha512', config.get('paystack.secretKey'))
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (hash !== req.headers['x-paystack-signature']) {
        logger.info('Paystack Signature invalid');
        const error = new ForbiddenError('Paystack Signature invalid', {
          code: 'BAD_PAYSTACK_SIGNATURE',
        });

        return ResponseTransformer.error({ res, error });
      }

      logger.info('Paystack Signature pass');
      next();
    },
);
