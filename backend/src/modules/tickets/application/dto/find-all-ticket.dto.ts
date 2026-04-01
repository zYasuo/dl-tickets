import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';
import { TicketStatus } from '../../domain/entities/ticket.entity';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Expected YYYY-MM-DD');

export const SFindAllTicket = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    cursor: z.uuid().optional(),
    createdFrom: dateOnly.optional(),
    createdTo: dateOnly.optional(),
    sortBy: z.enum(['title', 'status', 'updatedAt', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    status: z.enum(TicketStatus).optional(),
  })
  .refine((q) => !q.createdFrom || !q.createdTo || q.createdFrom <= q.createdTo, {
    message: 'createdFrom must be on or before createdTo',
    path: ['createdTo'],
  });

export type FindAllTicketsQuery = z.infer<typeof SFindAllTicket>;

export class FindAllTicketsQueryDto extends createZodDto(SFindAllTicket) {}
