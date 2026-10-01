import {Response} from 'express';
import {config} from '../config';
import {ApiError} from '../errors/api.error';

interface ResponseParams<T> {
  res: Response,
  data?: T,
  message?: string,
  code?: number,
  error?: Error
}

export default class ResponseTransformer {
  static success<T>({res, data, code = 200}: ResponseParams<T>): Response {
    return res.status(code).json({ data, code, status: true });
  }

  static error<T>({res, message, error, code = 400}: ResponseParams<T>): Response {
    const apiError = error instanceof ApiError ? error : undefined;
    const statusCode =  apiError?.statusCode || code;
    return res.status(statusCode).json({
      success: false,
      code: apiError?.config?.code,
      message: message || error?.message,
      stacktrace: config.get('isDev') ? error?.stack : undefined,
      data: apiError?.config?.data
    });
  }
}