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
import { ClientContractController } from 'src/modules/client-contracts/infrastructure/inbound/http/controllers/client-contract.controller';
import { CreateClientContractUseCase } from 'src/modules/client-contracts/application/use-cases/create-client-contract.use-case';
import { FindAllClientContractsUseCase } from 'src/modules/client-contracts/application/use-cases/find-all-client-contracts.use-case';
import { FindClientContractByIdUseCase } from 'src/modules/client-contracts/application/use-cases/find-client-contract-by-id.use-case';
import { UpdateClientContractUseCase } from 'src/modules/client-contracts/application/use-cases/update-client-contract.use-case';
import { createNestFastifyTestingApp } from 'src/test-support/create-nest-fastify-testing-app';

class MemoryRateLimitStore {
  private readonly counts = new Map<string, number>();

  increment(key: string, _windowSeconds: number): Promise<{ count: number }> {
    const c = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, c);
    return Promise.resolve({ count: c });
  }
}

describe('Client contracts require auth (e2e-style)', () => {
  let app: NestFastifyApplication;
  let tokenProvider: jest.Mocked<Pick<TokenProviderPort, 'verifyAccessToken'>>;

  beforeEach(async () => {
    tokenProvider = {
      verifyAccessToken: jest.fn().mockRejectedValue(new Error('invalid')),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, load: [rateLimitConfig] }), RateLimitModule],
      controllers: [ClientContractController],
      providers: [
        { provide: APP_PIPE, useClass: AppZodValidationPipe },
        { provide: CreateClientContractUseCase, useValue: { execute: jest.fn() } },
        { provide: FindAllClientContractsUseCase, useValue: { execute: jest.fn() } },
        { provide: FindClientContractByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateClientContractUseCase, useValue: { execute: jest.fn() } },
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

  it('GET /api/v1/client-contracts without Authorization returns 401', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/client-contracts')
      .query({ page: 1, limit: 10 })
      .expect(401);
  });

  it('POST /api/v1/client-contracts without Authorization returns 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/client-contracts')
      .send({ contractNumber: 'C1' })
      .expect(401);
  });

  it('returns 401 for invalid Bearer token on client-contracts', async () => {
    tokenProvider.verifyAccessToken.mockRejectedValue(new Error('bad'));
    await request(app.getHttpServer())
      .get('/api/v1/client-contracts')
      .set('Authorization', 'Bearer invalid')
      .query({ page: 1, limit: 10 })
      .expect(401);
  });
});
