import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.coerce.number().int().optional(),
  });

  it('throws when body is null', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(() => pipe.transform(null, { type: 'body', metatype: undefined, data: '' })).toThrow(
      BadRequestException,
    );
  });

  it('throws when body is undefined', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(() =>
      pipe.transform(undefined, { type: 'body', metatype: undefined, data: '' }),
    ).toThrow(BadRequestException);
  });

  it('parses valid body', () => {
    const pipe = new ZodValidationPipe(schema);
    const out = pipe.transform(
      { name: 'Ada' },
      {
        type: 'body',
        metatype: undefined,
        data: '',
      },
    );
    expect(out).toEqual({ name: 'Ada' });
  });

  it('throws BadRequestException with Zod errors on invalid body', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(() =>
      pipe.transform({ name: '' }, { type: 'body', metatype: undefined, data: '' }),
    ).toThrow(BadRequestException);
    try {
      pipe.transform({ name: '' }, { type: 'body', metatype: undefined, data: '' });
    } catch (e) {
      const res = (e as BadRequestException).getResponse() as Record<string, unknown>;
      expect(res.message).toBe('Validation failed');
      expect(res.errors).toBeDefined();
    }
  });

  it('defaults query to empty object when undefined', () => {
    const q = z.object({ page: z.coerce.number().default(1) });
    const pipe = new ZodValidationPipe(q);
    const out = pipe.transform(undefined, {
      type: 'query',
      metatype: undefined,
      data: '',
    });
    expect(out).toEqual({ page: 1 });
  });

  it('defaults query to empty object when null', () => {
    const q = z.object({ page: z.coerce.number().default(1) });
    const pipe = new ZodValidationPipe(q);
    const out = pipe.transform(null, {
      type: 'query',
      metatype: undefined,
      data: '',
    });
    expect(out).toEqual({ page: 1 });
  });

  it('passes through for non-body non-query metadata', () => {
    const pipe = new ZodValidationPipe(schema);
    const custom = { x: 1 };
    const out = pipe.transform(custom, {
      type: 'custom',
      metatype: undefined,
      data: '',
    });
    expect(out).toBe(custom);
  });
});
