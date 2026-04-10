import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import {
  ApplicationException,
  COMMON_API_ERROR_CODES,
  resolveApplicationErrorHttp,
} from '../errors/application';
import { DomainError } from '../errors/domain.error';
import { ConcurrencyError } from '../errors/concurrency.error';
import type { HttpErrorEnvelope } from './http-contract.types';
import { ZodSerializationException } from 'nestjs-zod';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyReply>();

    const body = this.toErrorBody(exception);
    res.status(body.statusCode).send(body);
  }

  private toErrorBody(exception: unknown): HttpErrorEnvelope {
    const timestamp = new Date().toISOString();

    if (exception instanceof ApplicationException) {
      const meta = resolveApplicationErrorHttp(exception.code);
      if (!meta) {
        this.logger.warn(`Unknown application error code: ${exception.code}`);
        return {
          success: false,
          timestamp,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'Internal server error',
          code: exception.code,
        };
      }
      return {
        success: false,
        timestamp,
        statusCode: meta.statusCode,
        error: meta.error,
        message: exception.message,
        code: exception.code,
        ...(exception.details !== undefined ? { details: exception.details } : {}),
      };
    }

    if (exception instanceof DomainError) {
      return {
        success: false,
        timestamp,
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: exception.message,
        code: COMMON_API_ERROR_CODES.DOMAIN_VALIDATION_FAILED,
      };
    }

    if (exception instanceof ConcurrencyError) {
      return {
        success: false,
        timestamp,
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: exception.message,
        code: COMMON_API_ERROR_CODES.CONFLICT,
      };
    }

    if (exception instanceof ZodSerializationException) {
      const zodErr = exception.getZodError();
      this.logger.error(
        'Response failed Zod serialization',
        zodErr instanceof Error ? zodErr.stack : JSON.stringify(zodErr),
      );
      return {
        success: false,
        timestamp,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Internal server error',
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const raw = exception.getResponse();
      let message: string | string[] = exception.message;
      let error = this.statusToTitle(statusCode);
      let details: unknown;
      let code: string | undefined;

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
        if (typeof o.code === 'string') {
          code = o.code;
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
        ...(code !== undefined ? { code } : {}),
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
