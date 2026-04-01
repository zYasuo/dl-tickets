import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RATE_LIMIT_STORE, type RateLimitStore } from './di.tokens';
import type { RateLimitConfig, RateLimitEndpointKey } from '../../config/rate-limit.config';
import { RATE_LIMIT_ENDPOINT_KEY } from './rate-limit-endpoint.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    @Inject(RATE_LIMIT_STORE)
    private readonly rateLimitStore: RateLimitStore,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const endpoint = this.reflector.getAllAndOverride<RateLimitEndpointKey | undefined>(
      RATE_LIMIT_ENDPOINT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!endpoint) {
      return true;
    }

    const rateLimits = this.configService.getOrThrow<RateLimitConfig>('rateLimit');
    const entry = rateLimits[endpoint];

    const req = context.switchToHttp().getRequest<Request>();
    const tracker = this.clientIp(req);
    const key = `${endpoint}:${tracker}`;

    const { count } = await this.rateLimitStore.increment(key, entry.windowSeconds);
    if (count > entry.max) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private clientIp(req: Request): string {
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  }
}
