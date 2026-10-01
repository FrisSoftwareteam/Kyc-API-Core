export interface ErrorConfig {
  code: string;
  data?: Record<string, unknown>;
}

export abstract class ApiError extends Error {
  public readonly statusCode: number;

  public readonly config?: ErrorConfig;

  protected constructor(message: string, config?: ErrorConfig) {
    super(message);
    this.config = config;
  }
}

export class AuthFailureError extends ApiError {
  readonly statusCode = 401;

  constructor(message = 'Invalid Credentials', config?: ErrorConfig) {
    super(message, config);
  }
}

export class InternalError extends ApiError {
  readonly statusCode: number = 500;
  constructor(message = 'Internal error', config?: ErrorConfig) {
    super(message, config);
  }
}

export class BadRequestError extends ApiError {
  readonly statusCode = 400;

  constructor(message = 'Bad Request', config?: ErrorConfig) {
    super(message, config);
  }
}

export class NotFoundError extends ApiError {
  readonly statusCode = 404;
  constructor(message = 'Not Found', config?: ErrorConfig) {
    super(message, config);
  }
}

export class ForbiddenError extends ApiError {
  readonly statusCode = 403;
  constructor(message = 'Permission denied', config?: ErrorConfig) {
    super(message, config);
  }
}

export class ConflictError extends ApiError {
  readonly statusCode = 409;
  constructor(message = 'Duplicate denied', config?: ErrorConfig) {
    super(message, config);
  }
}
