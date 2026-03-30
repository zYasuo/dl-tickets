import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CachePort } from 'src/common/ports/cache/cache.ports';
import { Description } from '../../domain/vo/description.vo';
import { TicketEntity, TicketStatus } from '../../domain/entities/ticket.entity';
import { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { ticketUserListVersionKey } from '../cache/ticket-key-builder.cache';
import { ticketCacheKey } from '../cache/ticket-cache.key';
import { UpdateTicketUseCase } from './update-ticket.use-case';

describe('UpdateTicketUseCase', () => {
  let useCase: UpdateTicketUseCase;
  let ticketRepository: jest.Mocked<Pick<TicketRepositoryPort, 'findById' | 'update'>>;
  let cachePort: jest.Mocked<
    Pick<CachePort, 'del' | 'get' | 'set' | 'exists' | 'getJson' | 'setJson' | 'incr' | 'acquireLock' | 'releaseLock'>
  >;

  const ticketId = randomUUID();
  const userId = randomUUID();
  const updatedAt = new Date('2025-04-01T08:00:00.000Z');
  const createdAt = new Date('2025-03-01T08:00:00.000Z');

  const existing = TicketEntity.create({
    id: ticketId,
    title: 'Old',
    description: Description.create('Old desc'),
    status: TicketStatus.OPEN,
    createdAt,
    updatedAt: createdAt,
    userId,
  });

  beforeEach(() => {
    ticketRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    cachePort = {
      del: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      exists: jest.fn(),
      getJson: jest.fn(),
      setJson: jest.fn(),
      incr: jest.fn(),
      acquireLock: jest.fn(),
      releaseLock: jest.fn(),
    };
    useCase = new UpdateTicketUseCase(
      ticketRepository as unknown as TicketRepositoryPort,
      cachePort as unknown as CachePort,
    );
  });

  it('throws NotFoundException when ticket missing', async () => {
    ticketRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(ticketId, userId, {
        title: 'T',
        description: 'D',
        status: TicketStatus.IN_PROGRESS,
        updatedAt: updatedAt.toISOString(),
      }),
    ).rejects.toThrow(NotFoundException);

    expect(cachePort.incr).not.toHaveBeenCalled();
    expect(cachePort.del).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when updatedAt is not a valid date', async () => {
    ticketRepository.findById.mockResolvedValue(existing);

    await expect(
      useCase.execute(ticketId, userId, {
        title: 'T',
        description: 'D',
        status: TicketStatus.IN_PROGRESS,
        updatedAt: 'not-a-date',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates repository and deletes ticket cache key', async () => {
    ticketRepository.findById.mockResolvedValue(existing);
    const updated = TicketEntity.create({
      id: ticketId,
      title: 'New title',
      description: Description.create('New desc'),
      status: TicketStatus.DONE,
      createdAt,
      updatedAt,
      userId,
    });
    ticketRepository.update.mockResolvedValue(updated);

    const result = await useCase.execute(ticketId, userId, {
      title: 'New title',
      description: 'New desc',
      status: TicketStatus.DONE,
      updatedAt: updatedAt.toISOString(),
    });

    expect(result.title).toBe('New title');
    expect(cachePort.incr).toHaveBeenCalledWith(ticketUserListVersionKey(userId));
    expect(cachePort.del).toHaveBeenCalledWith(ticketCacheKey(ticketId));
  });

  it('throws ForbiddenException when user is not the owner', async () => {
    ticketRepository.findById.mockResolvedValue(existing);

    await expect(
      useCase.execute(ticketId, randomUUID(), {
        title: 'T',
        description: 'D',
        status: TicketStatus.IN_PROGRESS,
        updatedAt: updatedAt.toISOString(),
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
