import { Injectable } from '@nestjs/common';
import { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import type { TFindAllTicket } from '../dto/find-all-ticket.dto';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';

@Injectable()
export class FindAllTicketsUseCase {
  constructor(private readonly ticketRepository: TicketRepositoryPort) {}

  async execute(input: TFindAllTicket): Promise<PaginatedResult<TicketEntity>> {
    return this.ticketRepository.findAll({
      page: input.page,
      limit: input.limit,
      cursor: input.cursor,
    });
  }
}
