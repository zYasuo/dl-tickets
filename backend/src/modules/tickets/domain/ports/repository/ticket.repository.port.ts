import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import { TicketEntity } from '../../entities/ticket.entity';
import type { TicketListCriteria } from '../../criteria/ticket-list.criteria';

export abstract class TicketRepositoryPort {
  abstract create(ticket: TicketEntity): Promise<TicketEntity>;
  abstract findAll(criteria: TicketListCriteria): Promise<PaginatedResult<TicketEntity>>;
  abstract findById(id: string): Promise<TicketEntity | null>;
  abstract findByUserId(userId: string): Promise<TicketEntity[]>;
  abstract update(ticket: TicketEntity): Promise<TicketEntity>;
}
