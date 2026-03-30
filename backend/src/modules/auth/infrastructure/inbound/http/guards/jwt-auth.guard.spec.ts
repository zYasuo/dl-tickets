import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { TokenProviderPort } from 'src/modules/auth/domain/ports/security/token-provider.port';
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let tokenProvider: { verifyAccessToken: jest.Mock };

  const httpContext = (headers: Record<string, string | undefined>) => {
    return {
      getType: () => 'http' as const,
      getHandler: () => ({}),
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    tokenProvider = { verifyAccessToken: jest.fn() };
    guard = new JwtAuthGuard(
      reflector as unknown as Reflector,
      tokenProvider as unknown as TokenProviderPort,
    );
  });

  it('allows public routes without token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = httpContext({});
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws when no bearer token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = httpContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('sets user when token valid', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    tokenProvider.verifyAccessToken.mockResolvedValue({
      sub: 'uuid-1',
      email: 'a@b.com',
    });
    const req: { headers: Record<string, string>; user?: unknown } = {
      headers: { authorization: 'Bearer valid.jwt' },
    };
    const ctx = {
      getType: () => 'http' as const,
      getHandler: () => ({}),
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user).toEqual({ sub: 'uuid-1', email: 'a@b.com' });
  });
});
