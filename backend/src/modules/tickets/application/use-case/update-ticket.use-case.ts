import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_PORT, TICKET_REPOSITORY } from 'src/di/tokens';
import type { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import { Description } from '../../domain/vo/description.vo';
import type { CachePort } from 'src/common/ports/cache/cache.ports';
import { ticketCacheKey } from '../cache/ticket-cache.key';
import type { TUpdateTicket } from '../dto/update-ticket.dto';

@Injectable()
export class UpdateTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort,
    @Inject(CACHE_PORT) private readonly cachePort: CachePort,
  ) {}

  async execute(
    ticketId: string,
    userUuid: string,
    input: TUpdateTicket,
  ): Promise<TicketEntity> {
    const current = await this.ticketRepository.findById(ticketId);
    if (!current) {
      throw new NotFoundException('Ticket not found');
    }

    if (current.userId !== userUuid) {
      throw new ForbiddenException();
    }

    const expectedVersion = new Date(input.updatedAt);
    if (Number.isNaN(expectedVersion.getTime())) {
      throw new BadRequestException('Invalid updatedAt');
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
    await this.cachePort.del(ticketCacheKey(ticketId));
    return updated;
  }
}
