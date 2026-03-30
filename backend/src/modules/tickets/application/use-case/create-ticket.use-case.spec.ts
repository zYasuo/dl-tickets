import { randomUUID } from 'node:crypto';
import type { CachePort } from 'src/common/ports/cache/cache.ports';
import { NotificationEntity } from 'src/modules/notifications/domain/entities/notification.entity';
import type { NotificationRepositoryPort } from 'src/modules/notifications/domain/ports/repository/notification.repository.port';
import type { NotificationQueuePort } from 'src/modules/notifications/domain/ports/queue/notification-queue.port';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import type { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { encodeTicketRow } from '../mappers/ticket-cache.codec';
import { ticketCacheKey } from '../cache/ticket-cache.key';
import { CreateTicketUseCase } from './create-ticket.use-case';

describe('CreateTicketUseCase', () => {
  let useCase: CreateTicketUseCase;
  let ticketRepository: jest.Mocked<Pick<TicketRepositoryPort, 'create'>>;
  let cachePort: jest.Mocked<
    Pick<CachePort, 'incr' | 'setJson' | 'get' | 'set' | 'del' | 'exists' | 'getJson' | 'acquireLock' | 'releaseLock'>
  >;
  let notificationRepository: jest.Mocked<Pick<NotificationRepositoryPort, 'create'>>;
  let notificationQueue: jest.Mocked<Pick<NotificationQueuePort, 'enqueueTicketCreated'>>;
  let userRepository: jest.Mocked<Pick<UserRepositoryPort, 'findByUuid'>>;

  const userId = randomUUID();
  const now = new Date('2025-03-01T10:00:00.000Z');

  beforeEach(() => {
    ticketRepository = { create: jest.fn() };
    cachePort = {
      incr: jest.fn(),
      setJson: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      getJson: jest.fn(),
      acquireLock: jest.fn(),
      releaseLock: jest.fn(),
    };
    notificationRepository = { create: jest.fn() };
    notificationQueue = { enqueueTicketCreated: jest.fn() };
    userRepository = { findByUuid: jest.fn() };

    userRepository.findByUuid.mockResolvedValue(
      UserEntity.create({
        id: userId,
        name: 'Pat',
        email: 'pat@example.com',
        password: 'hashed-password-ok',
        createdAt: now,
        updatedAt: now,
      }),
    );

    useCase = new CreateTicketUseCase(
      ticketRepository as unknown as TicketRepositoryPort,
      cachePort as unknown as CachePort,
      notificationRepository as unknown as NotificationRepositoryPort,
      notificationQueue as unknown as NotificationQueuePort,
      userRepository as unknown as UserRepositoryPort,
    );

    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('persists ticket, bumps list version, caches ticket, creates notification and enqueues job', async () => {
    ticketRepository.create.mockImplementation(async (t) =>
      TicketEntity.create({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        userId: t.userId,
      }),
    );

    notificationRepository.create.mockImplementation(async (n: NotificationEntity) => n);

    const result = await useCase.execute(
      {
        title: 'Bug',
        description: 'Something broke',
      },
      userId,
    );

    expect(result.id).toBeDefined();
    expect(cachePort.incr).toHaveBeenCalledWith('tickets:all:version');
    expect(cachePort.setJson).toHaveBeenCalledWith(
      ticketCacheKey(result.id),
      encodeTicketRow(result),
      60 * 5,
    );
    expect(notificationRepository.create).toHaveBeenCalled();
    const enqueueArg = notificationQueue.enqueueTicketCreated.mock.calls[0][0];
    expect(enqueueArg.ticketId).toBe(result.id);
    expect(enqueueArg.ticketTitle).toBe('Bug');
    expect(enqueueArg.userId).toBe(userId);
    expect(enqueueArg.recipient).toBe('pat@example.com');
    expect(typeof enqueueArg.notificationId).toBe('string');
  });
});
