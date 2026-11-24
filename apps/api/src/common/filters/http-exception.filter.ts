import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '@buildmind/shared-types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorName = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        message = (r['message'] as string | string[]) || exception.message;
        errorName = (r['error'] as string) || exception.name;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = process.env.NODE_ENV === 'production'
        ? 'An unexpected internal server error occurred'
        : exception.message;
      errorName = exception.name;
    }

    // In production, sanitize 500 internal errors to prevent database / stack leaks
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
      message = 'An unexpected internal server error occurred. Please contact support with correlation ID.';
      errorName = 'InternalServerError';
    }

    const correlationId =
      (request.headers['x-correlation-id'] as string) ||
      `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const errorBody: ApiErrorResponse = {
      success: false,
      statusCode: status,
      error: errorName,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      correlationId,
    };

    response.status(status).json(errorBody);
  }
}
