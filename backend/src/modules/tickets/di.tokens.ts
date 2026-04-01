import type { InjectionToken } from '@nestjs/common';
import type { TicketRepositoryPort } from 'src/modules/tickets/domain/ports/repository/ticket.repository.port';

export const TICKET_REPOSITORY: InjectionToken<TicketRepositoryPort> = Symbol('TICKET_REPOSITORY');
