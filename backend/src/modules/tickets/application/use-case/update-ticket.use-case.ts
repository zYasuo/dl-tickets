import { Inject, Injectable } from '@nestjs/common';
import { ApplicationException } from 'src/common/errors/application';
import { CACHE_PORT } from 'src/modules/cache/di.tokens';
import { TICKET_REPOSITORY } from '../../di.tokens';
import type { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import { Description } from '../../domain/vo/description.vo';
import type { CachePort } from 'src/common/ports/cache/cache.ports';
import { ticketUserListVersionKey } from '../cache/ticket-key-builder.cache';
import { ticketCacheKey } from '../cache/ticket-cache.key';
import type { UpdateTicketBody } from '../dto/update-ticket.dto';
import { TICKET_API_ERROR_CODES } from '../errors';

@Injectable()
export class UpdateTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort,
    @Inject(CACHE_PORT) private readonly cachePort: CachePort,
  ) {}

  async execute(
    ticketId: string,
    userUuid: string,
    input: UpdateTicketBody,
  ): Promise<TicketEntity> {
    const current = await this.ticketRepository.findById(ticketId);
    if (!current) {
      throw new ApplicationException(TICKET_API_ERROR_CODES.NOT_FOUND, 'Ticket not found');
    }

    if (current.userId !== userUuid) {
      throw new ApplicationException(TICKET_API_ERROR_CODES.ACCESS_DENIED, 'Forbidden');
    }

    const expectedVersion = new Date(input.updatedAt);
    if (Number.isNaN(expectedVersion.getTime())) {
      throw new ApplicationException(TICKET_API_ERROR_CODES.INVALID_VERSION, 'Invalid updatedAt');
    }

    const toUpdate = TicketEntity.create({
      id: current.id,
      title: input.title,
      description: Description.create(input.description),
      status: input.status,
      createdAt: current.createdAt,
      updatedAt: expectedVersion,
      userId: current.userId,
    });

    const updated = await this.ticketRepository.update(toUpdate);
    await this.cachePort.incr(ticketUserListVersionKey(current.userId));
    await this.cachePort.del(ticketCacheKey(ticketId));
    return updated;
  }
}
