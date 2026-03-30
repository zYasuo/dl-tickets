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
import { authConfig } from '../src/config/auth.config';
import { AuthController } from '../src/modules/auth/infrastructure/inbound/http/controllers/auth.controller';
import { LoginUseCase } from '../src/modules/auth/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../src/modules/auth/application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../src/modules/auth/application/use-cases/logout.use-case';
import { RequestPasswordResetUseCase } from '../src/modules/auth/application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../src/modules/auth/application/use-cases/reset-password.use-case';

class MemoryRateLimitStore {
  private readonly counts = new Map<string, number>();

  async increment(key: string, _windowSeconds: number): Promise<{ count: number }> {
    const c = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, c);
    return { count: c };
  }
}

describe('Auth HTTP (e2e-style)', () => {
  let app: INestApplication<App>;
  let loginUseCase: jest.Mocked<Pick<LoginUseCase, 'execute'>>;
  let refreshUseCase: jest.Mocked<Pick<RefreshTokenUseCase, 'execute'>>;
  let logoutUseCase: jest.Mocked<Pick<LogoutUseCase, 'execute'>>;
  let requestResetUseCase: jest.Mocked<Pick<RequestPasswordResetUseCase, 'execute'>>;
  let resetPasswordUseCase: jest.Mocked<Pick<ResetPasswordUseCase, 'execute'>>;

  beforeEach(async () => {
    loginUseCase = { execute: jest.fn() };
    refreshUseCase = { execute: jest.fn() };
    logoutUseCase = { execute: jest.fn() };
    requestResetUseCase = { execute: jest.fn() };
    resetPasswordUseCase = { execute: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [rateLimitConfig, authConfig],
        }),
        RateLimitModule,
      ],
      controllers: [AuthController],
      providers: [
        { provide: LoginUseCase, useValue: loginUseCase },
        { provide: RefreshTokenUseCase, useValue: refreshUseCase },
        { provide: LogoutUseCase, useValue: logoutUseCase },
        { provide: RequestPasswordResetUseCase, useValue: requestResetUseCase },
        { provide: ResetPasswordUseCase, useValue: resetPasswordUseCase },
        { provide: APP_GUARD, useClass: RateLimitGuard },
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

  it('POST /auth/login returns envelope with accessToken', async () => {
    loginUseCase.execute.mockResolvedValue({
      accessToken: 'jwt-here',
      refreshToken: 'refresh-here',
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'a@b.com', password: 'password12' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBe('jwt-here');
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken=')]),
    );
  });

  it('POST /auth/password-reset/request returns fixed message', async () => {
    requestResetUseCase.execute.mockResolvedValue(
      'If this email is registered, a recovery link will be sent',
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/password-reset/request')
      .send({ email: 'anyone@example.com' })
      .expect(200);

    expect(res.body.data.message).toBe(
      'If this email is registered, a recovery link will be sent',
    );
  });
});
