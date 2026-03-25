import { TicketEntity } from '../../entities/ticket.entity';
import type {
  PaginatedResult,
  PaginationParams,
} from 'src/common/pagination/pagination.types';

export abstract class TicketRepositoryPort {
  abstract create(ticket: TicketEntity): Promise<TicketEntity>;
  abstract findAll(
    params: PaginationParams,
  ): Promise<PaginatedResult<TicketEntity>>;
  abstract findById(id: string): Promise<TicketEntity | null>;
  abstract findByUserId(userId: string): Promise<TicketEntity[]>;
  abstract update(ticket: TicketEntity): Promise<TicketEntity>;
}
