import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TICKET_REPOSITORY } from '../../di.tokens';
import type { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { TicketEntity } from '../../domain/entities/ticket.entity';

@Injectable()
export class FindTicketByIdUseCase {
  constructor(@Inject(TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort) {}

  async execute(ticketId: string, userUuid: string): Promise<TicketEntity> {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    if (ticket.userId !== userUuid) {
      throw new ForbiddenException();
    }
    return ticket;
  }
}
