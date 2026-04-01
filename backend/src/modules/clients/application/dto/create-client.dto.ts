import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const SAddressBody = z.object({
  street: z.string().min(1, 'Street is required'),
  number: z.string().min(1, 'Number is required'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Neighborhood is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  stateUuid: z.uuid('stateUuid must be a valid UUID'),
  cityUuid: z.uuid('cityUuid must be a valid UUID'),
});

export const SCreateClient = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    address: SAddressBody,
    isForeignNational: z.boolean().optional().default(false),
  })
  .refine((b) => Boolean(b.cpf?.trim()) || Boolean(b.cnpj?.trim()), {
    message: 'At least one of CPF or CNPJ is required',
    path: ['cpf'],
  })
  .refine((b) => !b.isForeignNational || !b.cpf?.trim(), {
    message: 'CPF is not allowed for foreign clients',
    path: ['cpf'],
  });

export type CreateClientBody = z.infer<typeof SCreateClient>;

export class CreateClientBodyDto extends createZodDto(SCreateClient) {}
