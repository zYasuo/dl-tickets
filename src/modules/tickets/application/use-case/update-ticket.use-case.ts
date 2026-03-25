import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import { Description } from '../../domain/vo/description.vo';
import { CachePort } from 'src/common/ports/cache/cache.ports';
import { ticketCacheKey } from '../cache/ticket-cache.key';
import type { TUpdateTicket } from '../dto/update-ticket.dto';

@Injectable()
export class UpdateTicketUseCase {
  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly cachePort: CachePort,
  ) {}

  async execute(ticketId: string, input: TUpdateTicket): Promise<TicketEntity> {
    const current = await this.ticketRepository.findById(ticketId);
    if (!current) {
      throw new NotFoundException('Ticket not found');
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
