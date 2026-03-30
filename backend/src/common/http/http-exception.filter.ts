import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConcurrencyError } from '../errors/concurrency.error';
import type { HttpErrorEnvelope } from './http-contract.types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const body = this.toErrorBody(exception);
    res.status(body.statusCode).json(body);
  }

  private toErrorBody(exception: unknown): HttpErrorEnvelope {
    const timestamp = new Date().toISOString();

    if (exception instanceof ConcurrencyError) {
      return {
        success: false,
        timestamp,
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const raw = exception.getResponse();
      let message: string | string[] = exception.message;
      let error = this.statusToTitle(statusCode);
      let details: unknown;

      if (typeof raw === 'string') {
        message = raw;
      } else if (raw && typeof raw === 'object') {
        const o = raw as Record<string, unknown>;
        if (o.message !== undefined) {
          message = o.message as string | string[];
        }
        if (typeof o.error === 'string') {
          error = o.error;
        }
        if (o.errors !== undefined) {
          details = o.errors;
        } else if (o.details !== undefined) {
          details = o.details;
        }
      }

      return {
        success: false,
        timestamp,
        statusCode,
        error,
        message,
        ...(details !== undefined ? { details } : {}),
      };
    }

    return {
      success: false,
      timestamp,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Internal server error',
    };
  }

  private statusToTitle(status: number): string {
    const titles: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    };
    return titles[status] ?? 'Error';
  }
}
