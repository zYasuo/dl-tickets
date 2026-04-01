import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { RateLimitGuard } from '../src/common/rate-limit/rate-limit.guard';
import { RateLimitModule } from '../src/common/rate-limit/rate-limit.module';
import { RateLimitRedisStore } from '../src/common/rate-limit/rate-limit-redis.store';
import { HttpExceptionFilter } from '../src/common/http/http-exception.filter';
import { TransformResponseInterceptor } from '../src/common/http/transform-response.interceptor';
import { rateLimitConfig } from '../src/config/rate-limit.config';
import { TOKEN_PROVIDER } from '../src/modules/auth/di.tokens';
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

describe('Clients require auth (e2e-style)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [rateLimitConfig] }),
        RateLimitModule,
      ],
      controllers: [ClientController],
      providers: [
        { provide: CreateClientUseCase, useValue: { execute: jest.fn() } },
        { provide: FindAllClientsUseCase, useValue: { execute: jest.fn() } },
        { provide: FindClientByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: APP_GUARD, useClass: RateLimitGuard },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        {
          provide: TOKEN_PROVIDER,
          useValue: {
            verifyAccessToken: jest.fn().mockRejectedValue(new Error('invalid')),
          },
        },
      ],
    })
      .overrideProvider(RateLimitRedisStore)
      .useValue(new MemoryRateLimitStore())
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new TransformResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/clients without Authorization returns 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/clients').query({ page: 1, limit: 10 }).expect(401);
  });

  it('POST /api/v1/clients without Authorization returns 401', async () => {
    await request(app.getHttpServer()).post('/api/v1/clients').send({ name: 'X' }).expect(401);
  });
});
