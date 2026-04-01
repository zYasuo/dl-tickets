import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const SFindAllClients = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  cursor: z.uuid().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  name: z.string().min(1).optional(),
});

export type TFindAllClients = z.infer<typeof SFindAllClients>;

export class FindAllClientsQueryDto extends createZodDto(SFindAllClients) {}
