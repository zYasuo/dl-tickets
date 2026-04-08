import { ExecutionContext, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AppZodValidationPipe } from 'src/common/pipes/app-zod-validation.pipe';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'node:crypto';
import { RateLimitGuard } from 'src/common/rate-limit/rate-limit.guard';
import { RateLimitModule } from 'src/common/rate-limit/rate-limit.module';
import { RateLimitRedisStore } from 'src/common/rate-limit/rate-limit-redis.store';
import { HttpExceptionFilter } from 'src/common/http/http-exception.filter';
import { TransformResponseInterceptor } from 'src/common/http/transform-response.interceptor';
import type { CachePort } from 'src/common/ports/cache/cache.ports';
import { rateLimitConfig } from 'src/config/rate-limit.config';
import { CACHE_PORT } from 'src/modules/cache/di.tokens';
import {
  NOTIFICATION_QUEUE_PORT,
  NOTIFICATION_REPOSITORY,
} from 'src/modules/notifications/di.tokens';
import { TICKET_REPOSITORY } from 'src/modules/tickets/di.tokens';
import { USER_REPOSITORY } from 'src/modules/users/di.tokens';
import { CreateTicketUseCase } from 'src/modules/tickets/application/use-case/create-ticket.use-case';
import { FindAllTicketsUseCase } from 'src/modules/tickets/application/use-case/find-all-tickets.use-case';
import { UpdateTicketUseCase } from 'src/modules/tickets/application/use-case/update-ticket.use-case';
import { FindTicketByIdUseCase } from 'src/modules/tickets/application/use-case/find-ticket-by-id.use-case';
import { TicketCacheKeyBuilder } from 'src/modules/tickets/application/cache/ticket-key-builder.cache';
import type { TicketRepositoryPort } from 'src/modules/tickets/domain/ports/repository/ticket.repository.port';
import { TicketController } from 'src/modules/tickets/infrastructure/inbound/http/controllers/ticket.controller';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import type { Request } from 'express';

class MemoryRateLimitStore {
  private readonly counts = new Map<string, number>();

  increment(key: string, _windowSeconds: number): Promise<{ count: number }> {
    const c = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, c);
    return Promise.resolve({ count: c });
  }
}

function createMemoryCachePort(): CachePort {
  const strings = new Map<string, string>();
  const locks = new Set<string>();

  return {
    get(key: string) {
      return Promise.resolve(strings.get(key) ?? null);
    },
    set(key: string, value: string, _ttl: number) {
      strings.set(key, value);
      return Promise.resolve();
    },
    del(key: string) {
      strings.delete(key);
      return Promise.resolve();
    },
    exists(key: string) {
      return Promise.resolve(strings.has(key));
    },
    getJson<T>(key: string): Promise<T | null> {
      const raw = strings.get(key);
      if (raw === undefined) return Promise.resolve(null);
      try {
        return Promise.resolve(JSON.parse(raw) as T);
      } catch {
        return Promise.resolve(null);
      }
    },
    setJson<T>(key: string, value: T, _ttl: number) {
      strings.set(key, JSON.stringify(value));
      return Promise.resolve();
    },
    incr(key: string) {
      const n = Number(strings.get(key) ?? 0) + 1;
      strings.set(key, String(n));
      return Promise.resolve(n);
    },
    acquireLock(key: string, _ttl: number) {
      if (locks.has(key)) return Promise.resolve(false);
      locks.add(key);
      return Promise.resolve(true);
    },
    releaseLock(key: string) {
      locks.delete(key);
      return Promise.resolve();
    },
  };
}

type TicketsListEnvelope = {
  success: boolean;
  data: {
    data: unknown[];
    meta: { page: number; limit: number };
  };
};

describe('Tickets HTTP (e2e-style)', () => {
  let app: INestApplication<App>;
  const e2eUserUuid = randomUUID();

  beforeEach(async () => {
    const ticketRepository: Pick<
      TicketRepositoryPort,
      'findAll' | 'create' | 'findById' | 'update'
    > = {
      findAll: jest.fn().mockResolvedValue({
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
      }),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, load: [rateLimitConfig] }), RateLimitModule],
      controllers: [TicketController],
      providers: [
        { provide: APP_PIPE, useClass: AppZodValidationPipe },
        { provide: APP_GUARD, useClass: RateLimitGuard },
        {
          provide: APP_GUARD,
          useValue: {
            canActivate: (context: ExecutionContext) => {
              const req = context
                .switchToHttp()
                .getRequest<Request & { user: { sub: string; email: string } }>();
              req.user = { sub: e2eUserUuid, email: 'e2e@example.com' };
              return true;
            },
          },
        },
        TicketCacheKeyBuilder,
        FindAllTicketsUseCase,
        CreateTicketUseCase,
        UpdateTicketUseCase,
        FindTicketByIdUseCase,
        { provide: TICKET_REPOSITORY, useValue: ticketRepository },
        { provide: CACHE_PORT, useValue: createMemoryCachePort() },
        {
          provide: NOTIFICATION_REPOSITORY,
          useValue: {
            create: jest.fn(),
            updateStatus: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: NOTIFICATION_QUEUE_PORT,
          useValue: {
            enqueueTicketCreated: jest.fn(),
            enqueuePasswordReset: jest.fn(),
            enqueueEmailVerificationOtp: jest.fn(),
          },
        },
        {
          provide: USER_REPOSITORY,
          useValue: {
            findByUuid: jest.fn((uuid: string) =>
              Promise.resolve(
                UserEntity.create({
                  id: uuid,
                  name: 'E2E User',
                  email: 'e2e@example.com',
                  emailVerifiedAt: new Date(),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }),
              ),
            ),
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

  it('GET /api/v1/tickets returns paginated envelope', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/tickets')
      .query({ page: 1, limit: 10 })
      .expect(200);

    const body = res.body as TicketsListEnvelope;
    expect(body.success).toBe(true);
    expect(body.data.data).toEqual([]);
    expect(body.data.meta).toMatchObject({ page: 1, limit: 10 });
  });
});
