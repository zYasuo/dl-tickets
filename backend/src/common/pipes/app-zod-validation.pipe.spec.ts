import { BadRequestException } from '@nestjs/common';
import type { ArgumentMetadata } from '@nestjs/common';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod/dto';
import { COMMON_API_ERROR_CODES } from '../errors/application';
import { AppZodValidationPipe } from './app-zod-validation.pipe';

const STestBody = z.object({
  name: z.string().min(1),
  age: z.coerce.number().int().optional(),
});
class TestBodyDto extends createZodDto(STestBody) {}

const STestQuery = z.object({ page: z.coerce.number().default(1) });
class TestQueryDto extends createZodDto(STestQuery) {}

function meta(type: 'body' | 'query' | 'param' | 'custom', metatype?: unknown): ArgumentMetadata {
  return { type, metatype: metatype as ArgumentMetadata['metatype'], data: '' };
}

describe('AppZodValidationPipe', () => {
  it('throws when body is null', () => {
    const pipe = new AppZodValidationPipe();
    expect(() => pipe.transform(null, meta('body', TestBodyDto))).toThrow(BadRequestException);
  });

  it('throws when body is undefined', () => {
    const pipe = new AppZodValidationPipe();
    expect(() => pipe.transform(undefined, meta('body', TestBodyDto))).toThrow(BadRequestException);
  });

  it('includes empty-body message when body is missing', () => {
    const pipe = new AppZodValidationPipe();
    try {
      pipe.transform(undefined, meta('body', TestBodyDto));
    } catch (e) {
      const res = (e as BadRequestException).getResponse() as Record<string, unknown>;
      expect(res.errors).toEqual({
        errors: ['Request body is empty or missing Content-Type: application/json header'],
      });
    }
  });

  it('parses valid body with ZodDto metatype', () => {
    const pipe = new AppZodValidationPipe();
    const out = pipe.transform({ name: 'Ada' }, meta('body', TestBodyDto));
    expect(out).toEqual({ name: 'Ada' });
  });

  it('throws BadRequestException with treeified errors on invalid body', () => {
    const pipe = new AppZodValidationPipe();
    expect(() => pipe.transform({ name: '' }, meta('body', TestBodyDto))).toThrow(
      BadRequestException,
    );
    try {
      pipe.transform({ name: '' }, meta('body', TestBodyDto));
    } catch (e) {
      const res = (e as BadRequestException).getResponse() as Record<string, unknown>;
      expect(res.message).toBe('Validation failed');
      expect(res.code).toBe(COMMON_API_ERROR_CODES.VALIDATION_FAILED);
      expect(res.errors).toBeDefined();
    }
  });

  it('defaults query to empty object when undefined', () => {
    const pipe = new AppZodValidationPipe();
    const out = pipe.transform(undefined, meta('query', TestQueryDto));
    expect(out).toEqual({ page: 1 });
  });

  it('defaults query to empty object when null', () => {
    const pipe = new AppZodValidationPipe();
    const out = pipe.transform(null, meta('query', TestQueryDto));
    expect(out).toEqual({ page: 1 });
  });

  it('passes through for non-body non-query metadata', () => {
    const pipe = new AppZodValidationPipe();
    const custom = { x: 1 };
    const out = pipe.transform(custom, meta('custom'));
    expect(out).toBe(custom);
  });

  it('validates when schema is passed to constructor (local pipe)', () => {
    const pipe = new AppZodValidationPipe(STestBody);
    const out = pipe.transform({ name: 'Bob' }, meta('body', undefined));
    expect(out).toEqual({ name: 'Bob' });
  });
});
