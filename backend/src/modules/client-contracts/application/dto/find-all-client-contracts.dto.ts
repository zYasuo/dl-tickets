import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

const contractStatusZ = z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']);

export const SFindAllClientContracts = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  cursor: z.uuid().optional(),
  sortBy: z
    .enum(['contractNumber', 'startDate', 'createdAt', 'updatedAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  clientId: z.uuid().optional(),
  status: contractStatusZ.optional(),
});

export type TFindAllClientContracts = z.infer<typeof SFindAllClientContracts>;

export class FindAllClientContractsQueryDto extends createZodDto(SFindAllClientContracts) {}
