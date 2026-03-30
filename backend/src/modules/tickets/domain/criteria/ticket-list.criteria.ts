import { TicketStatus } from '../entities/ticket.entity';

export type TicketListSortField = 'title' | 'status' | 'updatedAt' | 'createdAt';
export type TicketListSortDirection = 'asc' | 'desc';

export type TicketListCriteria = {
  page: number;
  limit: number;
  cursor?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy: TicketListSortField;
  sortOrder: TicketListSortDirection;
  status?: TicketStatus;
  userUuid?: string;
};
