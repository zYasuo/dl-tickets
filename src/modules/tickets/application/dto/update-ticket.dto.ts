import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';
import { Description } from '../../domain/vo/description.vo';
import { TicketStatus } from '../../domain/entities/ticket.entity';

export const SUpdateTicket = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(Description.MAX_LENGTH, 'Description must be at most 255 characters'),
  status: z.enum(TicketStatus),
  updatedAt: z.string().min(1, 'updatedAt is required (ISO string from last read)'),
});

export type TUpdateTicket = z.infer<typeof SUpdateTicket>;

export class UpdateTicketBodyDto extends createZodDto(SUpdateTicket) {}
