import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'node:crypto';
import { RateLimitGuard } from '../src/common/rate-limit/rate-limit.guard';
import { RateLimitModule } from '../src/common/rate-limit/rate-limit.module';
import { RateLimitRedisStore } from '../src/common/rate-limit/rate-limit-redis.store';
import { HttpExceptionFilter } from '../src/common/http/http-exception.filter';
import { TransformResponseInterceptor } from '../src/common/http/transform-response.interceptor';
import { rateLimitConfig } from '../src/config/rate-limit.config';
import { TOKEN_PROVIDER } from '../src/modules/auth/di.tokens';
import type { TokenProviderPort } from '../src/modules/auth/domain/ports/security/token-provider.port';
import { JwtAuthGuard } from '../src/modules/auth/infrastructure/inbound/http/guards/jwt-auth.guard';
import { ClientController } from '../src/modules/clients/infrastructure/inbound/http/controllers/client.controller';
import { CreateClientUseCase } from '../src/modules/clients/application/use-cases/create-client.use-case';
import { FindAllClientsUseCase } from '../src/modules/clients/application/use-cases/find-all-clients.use-case';
import { FindClientByIdUseCase } from '../src/modules/clients/application/use-cases/find-client-by-id.use-case';

class MemoryRateLimitStore {
  private readonly counts = new Map<string, number>();

  async increment(key: string, _windowSeconds: number): Promise<{ count: number }> {
    const c = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, c);
    return { count: c };
  }
}

const emptyList = {
  data: [],
  meta: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    nextCursor: null,
  },
};

describe('Clients security (e2e-style)', () => {
  let app: INestApplication<App>;
  let tokenProvider: jest.Mocked<Pick<TokenProviderPort, 'verifyAccessToken'>>;
  let findAllClients: jest.Mocked<Pick<FindAllClientsUseCase, 'execute'>>;

  beforeEach(async () => {
    tokenProvider = { verifyAccessToken: jest.fn() };
    findAllClients = { execute: jest.fn().mockResolvedValue(emptyList) };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [rateLimitConfig],
        }),
        RateLimitModule,
      ],
      controllers: [ClientController],
      providers: [
        { provide: CreateClientUseCase, useValue: { execute: jest.fn() } },
        { provide: FindAllClientsUseCase, useValue: findAllClients },
        { provide: FindClientByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: APP_GUARD, useClass: RateLimitGuard },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: TOKEN_PROVIDER, useValue: tokenProvider },
      ],
    })
      .overrideProvider(RateLimitRedisStore)
      .useValue(new MemoryRateLimitStore())
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new TransformResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    const config = app.get(ConfigService);
    const rl = config.getOrThrow<Record<string, { max: number; windowSeconds: number }>>(
      'rateLimit',
    );
    rl['clients-list'] = { max: 1, windowSeconds: 60 };

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 for malformed Bearer token', async () => {
    tokenProvider.verifyAccessToken.mockRejectedValue(new Error('bad'));
    await request(app.getHttpServer())
      .get('/api/v1/clients')
      .set('Authorization', 'Bearer not-a-jwt')
      .query({ page: 1, limit: 10 })
      .expect(401);
  });

  it('returns 429 after exceeding clients-list rate limit', async () => {
    const sub = randomUUID();
    tokenProvider.verifyAccessToken.mockResolvedValue({ sub, email: 'a@b.com' });

    await request(app.getHttpServer())
      .get('/api/v1/clients')
      .set('Authorization', 'Bearer ok')
      .query({ page: 1, limit: 10 })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/clients')
      .set('Authorization', 'Bearer ok')
      .query({ page: 1, limit: 10 })
      .expect(429);
  });
});
