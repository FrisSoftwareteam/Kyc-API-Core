import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import logger from '../core/Logger';

export const validate =
  (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        params: req.params,
        query: req.query,
        body: req.body,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error(JSON.stringify({ error, payload: req.body }));
        return res.status(400).json({
          success: false,
          message: 'Validation Errors',
          errors: error.errors,
        });
      }
      next(error);
    }
  };
