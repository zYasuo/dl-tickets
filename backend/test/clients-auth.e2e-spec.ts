import { ConfigModule } from '@nestjs/config';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AppZodValidationPipe } from 'src/common/pipes/app-zod-validation.pipe';
import request from 'supertest';
import { RateLimitGuard } from 'src/common/rate-limit/rate-limit.guard';
import { RateLimitModule } from 'src/common/rate-limit/rate-limit.module';
import { RateLimitRedisStore } from 'src/common/rate-limit/rate-limit-redis.store';
import { HttpExceptionFilter } from 'src/common/http/http-exception.filter';
import { TransformResponseInterceptor } from 'src/common/http/transform-response.interceptor';
import { rateLimitConfig } from 'src/config/rate-limit.config';
import { TOKEN_PROVIDER } from 'src/modules/auth/di.tokens';
import type { TokenProviderPort } from 'src/modules/auth/domain/ports/security/token-provider.port';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/inbound/http/guards/jwt-auth.guard';
import { ClientController } from 'src/modules/clients/infrastructure/inbound/http/controllers/client.controller';
import { CreateClientUseCase } from 'src/modules/clients/application/use-cases/create-client.use-case';
import { FindAllClientsUseCase } from 'src/modules/clients/application/use-cases/find-all-clients.use-case';
import { FindClientByIdUseCase } from 'src/modules/clients/application/use-cases/find-client-by-id.use-case';
import { SearchClientsUseCase } from 'src/modules/clients/application/use-cases/search-clients.use-case';
import { createNestFastifyTestingApp } from 'src/test-support/create-nest-fastify-testing-app';

class MemoryRateLimitStore {
  private readonly counts = new Map<string, number>();

  increment(key: string, _windowSeconds: number): Promise<{ count: number }> {
    const c = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, c);
    return Promise.resolve({ count: c });
  }
}

describe('Clients require auth (e2e-style)', () => {
  let app: NestFastifyApplication;
  let tokenProvider: jest.Mocked<Pick<TokenProviderPort, 'verifyAccessToken'>>;

  beforeEach(async () => {
    tokenProvider = {
      verifyAccessToken: jest.fn().mockRejectedValue(new Error('invalid')),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, load: [rateLimitConfig] }), RateLimitModule],
      controllers: [ClientController],
      providers: [
        { provide: APP_PIPE, useClass: AppZodValidationPipe },
        { provide: CreateClientUseCase, useValue: { execute: jest.fn() } },
        { provide: FindAllClientsUseCase, useValue: { execute: jest.fn() } },
        { provide: FindClientByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: SearchClientsUseCase, useValue: { execute: jest.fn() } },
        { provide: APP_GUARD, useClass: RateLimitGuard },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: TOKEN_PROVIDER, useValue: tokenProvider },
      ],
    })
      .overrideProvider(RateLimitRedisStore)
      .useValue(new MemoryRateLimitStore())
      .compile();

    app = await createNestFastifyTestingApp(moduleFixture, async (a) => {
      a.setGlobalPrefix('api/v1');
      a.useGlobalInterceptors(new TransformResponseInterceptor());
      a.useGlobalFilters(new HttpExceptionFilter());
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/clients without Authorization returns 401', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/clients')
      .query({ page: 1, limit: 10 })
      .expect(401);
  });

  it('POST /api/v1/clients without Authorization returns 401', async () => {
    await request(app.getHttpServer()).post('/api/v1/clients').send({ name: 'X' }).expect(401);
  });

  it('returns 401 for invalid Bearer token on clients', async () => {
    tokenProvider.verifyAccessToken.mockRejectedValue(new Error('bad'));
    await request(app.getHttpServer())
      .get('/api/v1/clients')
      .set('Authorization', 'Bearer invalid')
      .query({ page: 1, limit: 10 })
      .expect(401);
  });
});
