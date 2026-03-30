import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';
import { Description } from '../../domain/vo/description.vo';

export const SCreateTicket = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(Description.MAX_LENGTH, 'Description must be at most 255 characters'),
});

export type TCreateTicket = z.infer<typeof SCreateTicket>;

export class CreateTicketBodyDto extends createZodDto(SCreateTicket) {}
