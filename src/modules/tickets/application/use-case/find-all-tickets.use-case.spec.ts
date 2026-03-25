import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import { CachePort } from 'src/common/ports/cache/cache.ports';
import { TicketEntity, TicketStatus } from '../../domain/entities/ticket.entity';
import { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { TicketCacheKeyBuilder } from '../cache/ticket-key-buider.cache';
import { FindAllTicketsUseCase } from './find-all-tickets.use-case';

describe('FindAllTicketsUseCase', () => {
  let useCase: FindAllTicketsUseCase;
  let ticketRepository: jest.Mocked<Pick<TicketRepositoryPort, 'findAll'>>;
  let cachePort: jest.Mocked<
    Pick<CachePort, 'getJson' | 'setJson' | 'acquireLock' | 'releaseLock' | 'get' | 'set' | 'del' | 'exists' | 'incr'>
  >;
  let cacheKeyBuilder: TicketCacheKeyBuilder;

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
    cachePort.getJson.mockResolvedValueOnce(emptyPage);

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result).toBe(emptyPage);
    expect(ticketRepository.findAll).not.toHaveBeenCalled();
    expect(cachePort.acquireLock).not.toHaveBeenCalled();
  });

  it('on miss with lock acquired loads from repository and writes cache', async () => {
    cachePort.getJson.mockResolvedValueOnce(null);
    cachePort.acquireLock.mockResolvedValue(true);
    cachePort.getJson.mockResolvedValueOnce(null);
    ticketRepository.findAll.mockResolvedValue(emptyPage);

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result).toEqual(emptyPage);
    expect(ticketRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10, cursor: undefined });
    expect(cachePort.setJson).toHaveBeenCalledWith(listKey, emptyPage, 60 * 10);
    expect(cachePort.releaseLock).toHaveBeenCalled();
  });

  it('releases lock when repository throws', async () => {
    cachePort.getJson.mockResolvedValueOnce(null);
    cachePort.acquireLock.mockResolvedValue(true);
    cachePort.getJson.mockResolvedValueOnce(null);
    ticketRepository.findAll.mockRejectedValue(new Error('db down'));

    await expect(useCase.execute({ page: 1, limit: 10 })).rejects.toThrow('db down');
    expect(cachePort.releaseLock).toHaveBeenCalled();
  });

  it('waits and returns cached page when lock is not acquired', async () => {
    let getJsonCalls = 0;
    cachePort.getJson.mockImplementation(async () => {
      getJsonCalls += 1;
      if (getJsonCalls === 1) return null;
      if (getJsonCalls >= 3) return emptyPage;
      return null;
    });
    cachePort.acquireLock.mockResolvedValue(false);

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result).toBe(emptyPage);
    expect(ticketRepository.findAll).not.toHaveBeenCalled();
  });

  it('falls back to repository when lock wait expires without cache', async () => {
    jest.useFakeTimers({ legacyFakeTimers: false });

    cachePort.getJson.mockResolvedValue(null);
    cachePort.acquireLock.mockResolvedValue(false);
    ticketRepository.findAll.mockResolvedValue(emptyPage);

    const pending = useCase.execute({ page: 1, limit: 10 });
    await jest.advanceTimersByTimeAsync(2000);
    const result = await pending;

    expect(result).toEqual(emptyPage);
    expect(ticketRepository.findAll).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
