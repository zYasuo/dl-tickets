import { BadRequestException, INestApplication, UnauthorizedException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { RateLimitGuard } from 'src/common/rate-limit/rate-limit.guard';
import { RateLimitModule } from 'src/common/rate-limit/rate-limit.module';
import { RateLimitRedisStore } from 'src/common/rate-limit/rate-limit-redis.store';
import { HttpExceptionFilter } from 'src/common/http/http-exception.filter';
import { TransformResponseInterceptor } from 'src/common/http/transform-response.interceptor';
import { rateLimitConfig } from 'src/config/rate-limit.config';
import { authConfig } from 'src/modules/auth/config/auth.config';
import { AuthController } from 'src/modules/auth/infrastructure/inbound/http/controllers/auth.controller';
import { LoginUseCase } from 'src/modules/auth/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from 'src/modules/auth/application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from 'src/modules/auth/application/use-cases/logout.use-case';
import { RequestPasswordResetUseCase } from 'src/modules/auth/application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from 'src/modules/auth/application/use-cases/reset-password.use-case';

class MemoryRateLimitStore {
  private readonly counts = new Map<string, number>();

  increment(key: string, _windowSeconds: number): Promise<{ count: number }> {
    const c = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, c);
    return Promise.resolve({ count: c });
  }
}

type ApiEnvelope<T> = { success: boolean; data: T };

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

    const body = res.body as ApiEnvelope<{ accessToken: string }>;
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBe('jwt-here');
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

    expect((res.body as ApiEnvelope<{ message: string }>).data.message).toBe(
      'If this email is registered, a recovery link will be sent',
    );
  });

  it('POST /auth/password-reset/request returns same message for different emails (uniform response)', async () => {
    const msg = 'If this email is registered, a recovery link will be sent';
    requestResetUseCase.execute.mockResolvedValue(msg);

    const resKnown = await request(app.getHttpServer())
      .post('/api/v1/auth/password-reset/request')
      .send({ email: 'known@example.com' })
      .expect(200);
    const resUnknown = await request(app.getHttpServer())
      .post('/api/v1/auth/password-reset/request')
      .send({ email: 'unknown@example.com' })
      .expect(200);

    expect((resKnown.body as ApiEnvelope<{ message: string }>).data.message).toBe(msg);
    expect((resUnknown.body as ApiEnvelope<{ message: string }>).data.message).toBe(msg);
  });

  it('POST /auth/refresh returns new accessToken and refresh Set-Cookie when cookie valid', async () => {
    refreshUseCase.execute.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'refreshToken=old-refresh')
      .expect(200);

    expect((res.body as ApiEnvelope<{ accessToken: string }>).data.accessToken).toBe('new-access');
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken=')]),
    );
    expect(refreshUseCase.execute).toHaveBeenCalledWith('old-refresh');
  });

  it('POST /auth/refresh returns 401 when refresh cookie invalid', async () => {
    refreshUseCase.execute.mockRejectedValue(new UnauthorizedException());

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'refreshToken=bad')
      .expect(401);
  });

  it('POST /auth/logout clears refresh cookie and tolerates missing cookie', async () => {
    logoutUseCase.execute.mockResolvedValue(undefined);

    const res = await request(app.getHttpServer()).post('/api/v1/auth/logout').expect(200);

    expect((res.body as ApiEnvelope<{ message: string }>).data.message).toBe('Signed out');
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken=')]),
    );
    expect(logoutUseCase.execute).toHaveBeenCalledWith('');

    const withCookie = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', 'refreshToken=to-clear')
      .expect(200);

    expect((withCookie.body as ApiEnvelope<{ message: string }>).data.message).toBe('Signed out');
    expect(logoutUseCase.execute).toHaveBeenCalledWith('to-clear');
  });

  it('POST /auth/password-reset/confirm returns 200 when use case succeeds', async () => {
    resetPasswordUseCase.execute.mockResolvedValue(undefined);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/password-reset/confirm')
      .send({ token: 'reset-token', newPassword: 'password12' })
      .expect(200);

    expect((res.body as ApiEnvelope<{ message: string }>).data.message).toBe(
      'Password has been updated',
    );
  });

  it('POST /auth/password-reset/confirm returns 400 on invalid token', async () => {
    resetPasswordUseCase.execute.mockRejectedValue(
      new BadRequestException('Invalid or expired reset token'),
    );

    await request(app.getHttpServer())
      .post('/api/v1/auth/password-reset/confirm')
      .send({ token: 'bad', newPassword: 'password12' })
      .expect(400);
  });
});
