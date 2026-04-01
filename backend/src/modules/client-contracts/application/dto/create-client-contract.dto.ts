import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';
import { SAddressBody } from 'src/modules/clients/application/dto/create-client.dto';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Expected YYYY-MM-DD');

export const SCreateClientContract = z
  .object({
    contractNumber: z.string().min(1).max(100),
    clientId: z.uuid(),
    useClientAddress: z.boolean().default(true),
    address: SAddressBody.optional(),
    startDate: dateOnly,
    endDate: dateOnly.optional(),
  })
  .refine((b) => !b.endDate || b.startDate < b.endDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  })
  .refine((b) => b.useClientAddress || Boolean(b.address), {
    message: 'address is required when useClientAddress is false',
    path: ['address'],
  });

export type TCreateClientContract = z.infer<typeof SCreateClientContract>;

export class CreateClientContractBodyDto extends createZodDto(SCreateClientContract) {}
