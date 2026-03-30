import { ExecutionContext, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import type { CachePort } from '../src/common/ports/cache/cache.ports';
import { rateLimitConfig } from '../src/config/rate-limit.config';
import {
  CACHE_PORT,
  NOTIFICATION_QUEUE_PORT,
  NOTIFICATION_REPOSITORY,
  TICKET_REPOSITORY,
  USER_REPOSITORY,
} from '../src/di/tokens';
import { CreateTicketUseCase } from '../src/modules/tickets/application/use-case/create-ticket.use-case';
import { FindAllTicketsUseCase } from '../src/modules/tickets/application/use-case/find-all-tickets.use-case';
import { UpdateTicketUseCase } from '../src/modules/tickets/application/use-case/update-ticket.use-case';
import { FindTicketByIdUseCase } from '../src/modules/tickets/application/use-case/find-ticket-by-id.use-case';
import { TicketCacheKeyBuilder } from '../src/modules/tickets/application/cache/ticket-key-builder.cache';
import type { TicketRepositoryPort } from '../src/modules/tickets/domain/ports/repository/ticket.repository.port';
import { TicketController } from '../src/modules/tickets/infrastructure/inbound/http/controllers/ticket.controller';
import { UserEntity } from '../src/modules/users/domain/entities/user.entity';

class MemoryRateLimitStore {
  private readonly counts = new Map<string, number>();

  async increment(key: string, _windowSeconds: number): Promise<{ count: number }> {
    const c = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, c);
    return { count: c };
  }
}

function createMemoryCachePort(): CachePort {
  const strings = new Map<string, string>();
  const locks = new Set<string>();

  return {
    async get(key: string) {
      return strings.get(key) ?? null;
    },
    async set(key: string, value: string, _ttl: number) {
      strings.set(key, value);
    },
    async del(key: string) {
      strings.delete(key);
    },
    async exists(key: string) {
      return strings.has(key);
    },
    async getJson<T>(key: string): Promise<T | null> {
      const raw = strings.get(key);
      if (raw === undefined) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    async setJson<T>(key: string, value: T, _ttl: number) {
      strings.set(key, JSON.stringify(value));
    },
    async incr(key: string) {
      const n = Number(strings.get(key) ?? 0) + 1;
      strings.set(key, String(n));
      return n;
    },
    async acquireLock(key: string, _ttl: number) {
      if (locks.has(key)) return false;
      locks.add(key);
      return true;
    },
    async releaseLock(key: string) {
      locks.delete(key);
    },
  };
}

describe('Tickets HTTP (e2e-style)', () => {
  let app: INestApplication<App>;
  const e2eUserUuid = randomUUID();

  beforeEach(async () => {
    const ticketRepository: Pick<TicketRepositoryPort, 'findAll' | 'create' | 'findById' | 'update'> = {
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
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [rateLimitConfig] }),
        RateLimitModule,
      ],
      controllers: [TicketController],
      providers: [
        { provide: APP_GUARD, useClass: RateLimitGuard },
        {
          provide: APP_GUARD,
          useValue: {
            canActivate: (context: ExecutionContext) => {
              const req = context.switchToHttp().getRequest();
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
          },
        },
        {
          provide: USER_REPOSITORY,
          useValue: {
            findByUuid: jest.fn().mockImplementation(async (uuid: string) =>
              UserEntity.create({
                id: uuid,
                name: 'E2E User',
                email: 'e2e@example.com',
                password: 'hashed-password',
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
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
    const res = await request(app.getHttpServer()).get('/api/v1/tickets').query({ page: 1, limit: 10 }).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      data: [],
      meta: expect.objectContaining({ page: 1, limit: 10 }),
    });
  });
});
