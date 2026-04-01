import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Description } from '../../domain/vo/description.vo';
import { TicketEntity, TicketStatus } from '../../domain/entities/ticket.entity';
import type { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { FindTicketByIdUseCase } from './find-ticket-by-id.use-case';

describe('FindTicketByIdUseCase', () => {
  let useCase: FindTicketByIdUseCase;
  let ticketRepository: jest.Mocked<Pick<TicketRepositoryPort, 'findById'>>;

  const ticketId = randomUUID();
  const userId = randomUUID();
  const now = new Date('2025-06-01T12:00:00.000Z');

  const ticket = TicketEntity.create({
    id: ticketId,
    title: 'T',
    description: Description.create('D'),
    status: TicketStatus.OPEN,
    createdAt: now,
    updatedAt: now,
    userId,
  });

  beforeEach(() => {
    ticketRepository = { findById: jest.fn() };
    useCase = new FindTicketByIdUseCase(ticketRepository as unknown as TicketRepositoryPort);
  });

  it('throws NotFoundException when ticket is missing', async () => {
    ticketRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(ticketId, userId)).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when user is not the owner', async () => {
    ticketRepository.findById.mockResolvedValue(ticket);

    await expect(useCase.execute(ticketId, randomUUID())).rejects.toThrow(ForbiddenException);
  });

  it('returns ticket when found and owned by user', async () => {
    ticketRepository.findById.mockResolvedValue(ticket);

    const result = await useCase.execute(ticketId, userId);

    expect(result).toBe(ticket);
    expect(ticketRepository.findById).toHaveBeenCalledWith(ticketId);
  });
});
