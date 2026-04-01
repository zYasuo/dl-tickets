import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { TransformResponseInterceptor } from './transform-response.interceptor';

describe('TransformResponseInterceptor', () => {
  const interceptor = new TransformResponseInterceptor();

  it('wraps handler data in success envelope with timestamp', async () => {
    const ctx = {} as ExecutionContext;
    const next = { handle: () => of({ accessToken: 'x' }) };

    const result = await lastValueFrom(interceptor.intercept(ctx, next));

    expect(result).toMatchObject({
      success: true,
      data: { accessToken: 'x' },
      timestamp: expect.any(String),
    });
    expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
  });
});
