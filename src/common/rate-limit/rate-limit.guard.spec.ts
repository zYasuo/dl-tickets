import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { IRateLimitConfig } from '../../config/rate-limit.config';
import { RateLimitGuard } from './rate-limit.guard';
import type { RateLimitRedisStore } from './rate-limit-redis.store';

function httpContext(req: Partial<Request>): ExecutionContext {
  const handler = jest.fn();
  const controllerClass = class TestController {};
  const merged = {
    ...req,
    headers: { ...(req.headers ?? {}) },
  } as Request;

  return {
    getType: () => 'http',
    getHandler: () => handler,
    getClass: () => controllerClass,
    switchToHttp: () => ({
      getRequest: () => merged,
    }),
  } as unknown as ExecutionContext;
}

describe('RateLimitGuard', () => {
  const rateLimits: IRateLimitConfig = {
    'users-register': { max: 2, windowSeconds: 60 },
    'tickets-list': { max: 10, windowSeconds: 60 },
    'tickets-create': { max: 10, windowSeconds: 60 },
    'tickets-update': { max: 10, windowSeconds: 60 },
  };

  let configService: ConfigService;
  let store: jest.Mocked<Pick<RateLimitRedisStore, 'increment'>>;

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue(rateLimits),
    } as unknown as ConfigService;
    store = { increment: jest.fn() };
  });

  it('allows non-http context', async () => {
    const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
    const guard = new RateLimitGuard(reflector, configService, store as unknown as RateLimitRedisStore);
    const ctx = {
      getType: () => 'rpc',
    } as ExecutionContext;
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(store.increment).not.toHaveBeenCalled();
  });

  it('allows when endpoint metadata is absent', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RateLimitGuard(reflector, configService, store as unknown as RateLimitRedisStore);
    const ctx = httpContext({ ip: '127.0.0.1' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(store.increment).not.toHaveBeenCalled();
  });

  it('increments store and allows when within limit', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('tickets-list'),
    } as unknown as Reflector;
    store.increment.mockResolvedValue({ count: 1 });
    const guard = new RateLimitGuard(reflector, configService, store as unknown as RateLimitRedisStore);
    const ctx = httpContext({ ip: '10.0.0.1' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(store.increment).toHaveBeenCalledWith('tickets-list:10.0.0.1', 60);
  });

  it('throws 429 when count exceeds max', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('users-register'),
    } as unknown as Reflector;
    store.increment.mockResolvedValue({ count: 3 });
    const guard = new RateLimitGuard(reflector, configService, store as unknown as RateLimitRedisStore);
    const ctx = httpContext({ ip: '192.168.1.1' });
    try {
      await guard.canActivate(ctx);
      throw new Error('expected HttpException');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it('uses first x-forwarded-for address as client key', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('tickets-list'),
    } as unknown as Reflector;
    store.increment.mockResolvedValue({ count: 1 });
    const guard = new RateLimitGuard(reflector, configService, store as unknown as RateLimitRedisStore);
    const ctx = httpContext({
      headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' },
      ip: '127.0.0.1',
    });
    await guard.canActivate(ctx);
    expect(store.increment).toHaveBeenCalledWith('tickets-list:203.0.113.5', 60);
  });

  it('falls back to socket.remoteAddress when ip missing', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('tickets-list'),
    } as unknown as Reflector;
    store.increment.mockResolvedValue({ count: 1 });
    const guard = new RateLimitGuard(reflector, configService, store as unknown as RateLimitRedisStore);
    const ctx = httpContext({
      ip: undefined,
      socket: { remoteAddress: '::1' } as unknown as Request['socket'],
    });
    await guard.canActivate(ctx);
    expect(store.increment).toHaveBeenCalledWith('tickets-list:::1', 60);
  });
});
