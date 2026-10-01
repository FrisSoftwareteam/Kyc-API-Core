import { NextFunction, Request, Response } from 'express';

import ResponseTransformer from '../utils/response.transformer';

// eslint-disable-next-line  @typescript-eslint/no-unused-vars
export const errors = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let code: number;
  switch (err.name) {
    case 'BadRequest':
      code = 400;
      break;
    case 'Conflict':
      code = 409;
      break;
    case 'NotFound':
      code = 404;
      break;
    case 'Unauthorized':
      code = 401;
      break;
    default:
      code = 500;
  }

  ResponseTransformer.error({ res, error: err, code });
};
