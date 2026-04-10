import { ArgumentsHost, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ApplicationException, COMMON_API_ERROR_CODES } from '../errors/application';
import { DomainError } from '../errors/domain.error';
import { ConcurrencyError } from '../errors/concurrency.error';
import { AUTH_API_ERROR_CODES } from 'src/modules/auth/application/auth-api-error-codes';
import { ZodSerializationException } from 'nestjs-zod';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  function mockHost(res: Partial<FastifyReply>): ArgumentsHost {
    return {
      switchToHttp: () => ({
        getResponse: () => res as FastifyReply,
      }),
    } as ArgumentsHost;
  }

  it('maps HttpException to envelope with status and message', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const res = { status } as unknown as FastifyReply;

    filter.catch(new BadRequestException('Invalid input'), mockHost(res));

    expect(status).toHaveBeenCalledWith(400);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid input',
        timestamp: expect.any(String),
      }),
    );
  });

  it('maps ConcurrencyError to 409', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    filter.catch(new ConcurrencyError('stale'), mockHost({ status } as unknown as FastifyReply));

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'stale',
        code: COMMON_API_ERROR_CODES.CONFLICT,
      }),
    );
  });

  it('maps ZodSerializationException to 500 without leaking schema details', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const inner = new Error('schema mismatch');
    filter.catch(
      new ZodSerializationException(inner),
      mockHost({ status } as unknown as FastifyReply),
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
    );
    const bodyStr = JSON.stringify(send.mock.calls[0][0]);
    expect(bodyStr).not.toContain('schema mismatch');
  });

  it('maps unknown errors to 500 without leaking stack trace', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const err = new TypeError('internal detail');

    filter.catch(err, mockHost({ status } as unknown as FastifyReply));

    expect(status).toHaveBeenCalledWith(500);
    const body = send.mock.calls[0][0] as Record<string, unknown>;
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('Internal server error');
    expect(body).not.toHaveProperty('stack');
    expect(JSON.stringify(body)).not.toContain('internal detail');
  });

  it('uses object response from HttpException when provided', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const ex = new HttpException({ message: ['a', 'b'], error: 'Unprocessable Entity' }, 422);

    filter.catch(ex, mockHost({ status } as unknown as FastifyReply));

    expect(status).toHaveBeenCalledWith(422);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: ['a', 'b'],
        error: 'Unprocessable Entity',
      }),
    );
  });

  it('maps ApplicationException via registry', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    filter.catch(
      new ApplicationException(
        AUTH_API_ERROR_CODES.EMAIL_NOT_VERIFIED,
        'Complete email verification before signing in',
      ),
      mockHost({ status } as unknown as FastifyReply),
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.FORBIDDEN,
        code: AUTH_API_ERROR_CODES.EMAIL_NOT_VERIFIED,
        message: 'Complete email verification before signing in',
      }),
    );
  });

  it('maps DomainError to 400 with COMMON_DOMAIN_VALIDATION_FAILED', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    filter.catch(new DomainError('invalid'), mockHost({ status } as unknown as FastifyReply));

    expect(status).toHaveBeenCalledWith(400);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        code: COMMON_API_ERROR_CODES.DOMAIN_VALIDATION_FAILED,
        message: 'invalid',
      }),
    );
  });

  it('passes code from HttpException body when present', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    filter.catch(
      new BadRequestException({
        message: 'Validation failed',
        code: COMMON_API_ERROR_CODES.VALIDATION_FAILED,
        errors: {},
      }),
      mockHost({ status } as unknown as FastifyReply),
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        code: COMMON_API_ERROR_CODES.VALIDATION_FAILED,
      }),
    );
  });

  it('maps errors from HttpException body to details in envelope', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const tree = { name: { errors: ['Too short'] } };
    filter.catch(
      new BadRequestException({
        message: 'Validation failed',
        code: COMMON_API_ERROR_CODES.VALIDATION_FAILED,
        errors: tree,
      }),
      mockHost({ status } as unknown as FastifyReply),
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        details: tree,
        code: COMMON_API_ERROR_CODES.VALIDATION_FAILED,
      }),
    );
  });
});
