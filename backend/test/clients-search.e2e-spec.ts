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
import { SearchClientsUseCase } from '../src/modules/clients/application/use-cases/search-clients.use-case';

class MemoryRateLimitStore {
  private readonly counts = new Map<string, number>();

  async increment(key: string, _windowSeconds: number): Promise<{ count: number }> {
    const c = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, c);
    return { count: c };
  }
}

describe('Clients unified search (e2e-style)', () => {
  let app: INestApplication<App>;
  let tokenProvider: jest.Mocked<Pick<TokenProviderPort, 'verifyAccessToken'>>;
  let searchClients: jest.Mocked<Pick<SearchClientsUseCase, 'execute'>>;

  beforeEach(async () => {
    tokenProvider = { verifyAccessToken: jest.fn() };
    searchClients = {
      execute: jest.fn().mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          nextCursor: null,
        },
      }),
    };

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
        { provide: FindAllClientsUseCase, useValue: { execute: jest.fn() } },
        { provide: FindClientByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: SearchClientsUseCase, useValue: searchClients },
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
    const rl =
      config.getOrThrow<Record<string, { max: number; windowSeconds: number }>>('rateLimit');
    rl['clients-search'] = { max: 1, windowSeconds: 60 };

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /clients/search requires Authorization', async () => {
    tokenProvider.verifyAccessToken.mockRejectedValue(new Error('invalid'));
    await request(app.getHttpServer()).get('/api/v1/clients/search').query({ q: 'x' }).expect(401);
  });

  it('GET /clients/search forwards to use case when authenticated', async () => {
    const sub = randomUUID();
    tokenProvider.verifyAccessToken.mockResolvedValue({ sub, email: 'a@b.com' });

    await request(app.getHttpServer())
      .get('/api/v1/clients/search')
      .set('Authorization', 'Bearer fake')
      .query({ q: '529.982.247-25', page: 1, limit: 20 })
      .expect(200);

    expect(searchClients.execute).toHaveBeenCalledWith(
      expect.objectContaining({ q: '529.982.247-25', page: 1, limit: 20 }),
      sub,
    );
  });

  it('returns 429 when clients-search rate limit exceeded', async () => {
    const sub = randomUUID();
    tokenProvider.verifyAccessToken.mockResolvedValue({ sub, email: 'a@b.com' });

    await request(app.getHttpServer())
      .get('/api/v1/clients/search')
      .set('Authorization', 'Bearer fake')
      .query({ q: 'a' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/clients/search')
      .set('Authorization', 'Bearer fake')
      .query({ q: 'b' })
      .expect(429);
  });
});
