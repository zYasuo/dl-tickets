import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';
import { SAddressBody } from 'src/modules/clients/application/dto/create-client.dto';
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Expected YYYY-MM-DD');

export const SUpdateClientContract = z.object({
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
  endDate: dateOnly.nullable().optional(),
  useClientAddress: z.boolean().optional(),
  address: SAddressBody.optional(),
});

export type TUpdateClientContract = z.infer<typeof SUpdateClientContract>;

export class UpdateClientContractBodyDto extends createZodDto(SUpdateClientContract) {}
