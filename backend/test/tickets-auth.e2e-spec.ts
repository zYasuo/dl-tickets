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
import { TOKEN_PROVIDER } from '../src/di/tokens';
import { JwtAuthGuard } from '../src/modules/auth/infrastructure/inbound/http/guards/jwt-auth.guard';
import { TicketController } from '../src/modules/tickets/infrastructure/inbound/http/controllers/ticket.controller';
import { CreateTicketUseCase } from '../src/modules/tickets/application/use-case/create-ticket.use-case';
import { FindAllTicketsUseCase } from '../src/modules/tickets/application/use-case/find-all-tickets.use-case';
import { UpdateTicketUseCase } from '../src/modules/tickets/application/use-case/update-ticket.use-case';
import { FindTicketByIdUseCase } from '../src/modules/tickets/application/use-case/find-ticket-by-id.use-case';

class MemoryRateLimitStore {
  private readonly counts = new Map<string, number>();

  async increment(key: string, _windowSeconds: number): Promise<{ count: number }> {
    const c = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, c);
    return { count: c };
  }
}

describe('Tickets require auth (e2e-style)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [rateLimitConfig] }),
        RateLimitModule,
      ],
      controllers: [TicketController],
      providers: [
        { provide: CreateTicketUseCase, useValue: { execute: jest.fn() } },
        { provide: FindAllTicketsUseCase, useValue: { execute: jest.fn() } },
        { provide: FindTicketByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateTicketUseCase, useValue: { execute: jest.fn() } },
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

  it('GET /api/v1/tickets without Authorization returns 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/tickets').query({ page: 1, limit: 10 }).expect(401);
  });
});
