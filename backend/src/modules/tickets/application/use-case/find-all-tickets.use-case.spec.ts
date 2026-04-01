import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import { CachePort } from 'src/common/ports/cache/cache.ports';
import { Description } from '../../domain/vo/description.vo';
import { TicketEntity, TicketStatus } from '../../domain/entities/ticket.entity';
import { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { encodeTicketListPage } from '../mappers/ticket-cache.codec';
import { TicketCacheKeyBuilder } from '../cache/ticket-key-builder.cache';
import type { FindAllTicketsQuery } from '../dto/find-all-ticket.dto';
import { FindAllTicketsUseCase } from './find-all-tickets.use-case';

const listQuery = (overrides: Partial<FindAllTicketsQuery> = {}): FindAllTicketsQuery => ({
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  ...overrides,
});

describe('FindAllTicketsUseCase', () => {
  let useCase: FindAllTicketsUseCase;
  let ticketRepository: jest.Mocked<Pick<TicketRepositoryPort, 'findAll'>>;
  let cachePort: jest.Mocked<
    Pick<
      CachePort,
      | 'getJson'
      | 'setJson'
      | 'acquireLock'
      | 'releaseLock'
      | 'get'
      | 'set'
      | 'del'
      | 'exists'
      | 'incr'
    >
  >;
  let cacheKeyBuilder: TicketCacheKeyBuilder;

  const scopeUserUuid = 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee';
  const listKey = 'tickets:all:v1:page:1:limit:10:cursor:none';
  const emptyPage: PaginatedResult<TicketEntity> = {
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
  };

  const emptyListCachePayload = encodeTicketListPage(emptyPage);

  beforeEach(() => {
    ticketRepository = { findAll: jest.fn() };
    cachePort = {
      getJson: jest.fn(),
      setJson: jest.fn(),
      acquireLock: jest.fn(),
      releaseLock: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      incr: jest.fn(),
    };
    cacheKeyBuilder = new TicketCacheKeyBuilder(cachePort as unknown as CachePort);
    jest.spyOn(cacheKeyBuilder, 'buildListKey').mockResolvedValue(listKey);

    useCase = new FindAllTicketsUseCase(
      ticketRepository as unknown as TicketRepositoryPort,
      cachePort as unknown as CachePort,
      cacheKeyBuilder,
    );
  });

  it('returns cached page without hitting repository', async () => {
    cachePort.getJson.mockResolvedValueOnce(emptyListCachePayload);

    const result = await useCase.execute(listQuery(), scopeUserUuid);

    expect(result).toEqual(emptyPage);
    expect(ticketRepository.findAll).not.toHaveBeenCalled();
    expect(cachePort.acquireLock).not.toHaveBeenCalled();
  });

  it('decodes codec-shaped cache after Redis JSON round-trip', async () => {
    const entity = TicketEntity.create({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'T',
      description: Description.create('d'),
      status: TicketStatus.OPEN,
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      updatedAt: new Date('2020-01-02T00:00:00.000Z'),
      userId: '22222222-2222-4222-8222-222222222222',
    });
    const fromDb: PaginatedResult<TicketEntity> = {
      data: [entity],
      meta: emptyPage.meta,
    };
    const asInRedis = JSON.parse(JSON.stringify(encodeTicketListPage(fromDb)));

    cachePort.getJson.mockResolvedValueOnce(asInRedis);

    const result = await useCase.execute(listQuery(), scopeUserUuid);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toBeInstanceOf(TicketEntity);
    expect(result.data[0].title).toBe('T');
    expect(result.data[0].description.value).toBe('d');
    expect(ticketRepository.findAll).not.toHaveBeenCalled();
  });

  it('on miss with lock acquired loads from repository and writes cache', async () => {
    cachePort.getJson.mockResolvedValueOnce(null);
    cachePort.acquireLock.mockResolvedValue(true);
    cachePort.getJson.mockResolvedValueOnce(null);
    ticketRepository.findAll.mockResolvedValue(emptyPage);

    const result = await useCase.execute(listQuery(), scopeUserUuid);

    expect(result).toEqual(emptyPage);
    expect(ticketRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        userUuid: scopeUserUuid,
      }),
    );
    expect(cachePort.setJson).toHaveBeenCalledWith(
      listKey,
      encodeTicketListPage(emptyPage),
      60 * 10,
    );
    expect(cachePort.releaseLock).toHaveBeenCalled();
  });

  it('releases lock when repository throws', async () => {
    cachePort.getJson.mockResolvedValueOnce(null);
    cachePort.acquireLock.mockResolvedValue(true);
    cachePort.getJson.mockResolvedValueOnce(null);
    ticketRepository.findAll.mockRejectedValue(new Error('db down'));

    await expect(useCase.execute(listQuery(), scopeUserUuid)).rejects.toThrow('db down');
    expect(cachePort.releaseLock).toHaveBeenCalled();
  });

  it('waits and returns cached page when lock is not acquired', async () => {
    let getJsonCalls = 0;
    cachePort.getJson.mockImplementation(async () => {
      getJsonCalls += 1;
      if (getJsonCalls === 1) return null;
      if (getJsonCalls >= 3) return emptyListCachePayload;
      return null;
    });
    cachePort.acquireLock.mockResolvedValue(false);

    const result = await useCase.execute(listQuery(), scopeUserUuid);

    expect(result).toEqual(emptyPage);
    expect(ticketRepository.findAll).not.toHaveBeenCalled();
  });

  it('falls back to repository when lock wait expires without cache', async () => {
    jest.useFakeTimers({ legacyFakeTimers: false });

    cachePort.getJson.mockResolvedValue(null);
    cachePort.acquireLock.mockResolvedValue(false);
    ticketRepository.findAll.mockResolvedValue(emptyPage);

    const pending = useCase.execute(listQuery(), scopeUserUuid);
    await jest.advanceTimersByTimeAsync(2000);
    const result = await pending;

    expect(result).toEqual(emptyPage);
    expect(ticketRepository.findAll).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
