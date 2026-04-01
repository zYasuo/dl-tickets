import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const SAddressBody = z.object({
  street: z.string().min(1, 'Street is required'),
  number: z.string().min(1, 'Number is required'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Neighborhood is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be UF (2 letters)'),
  zipCode: z.string().min(1, 'ZIP code is required'),
});

export const SCreateClient = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    address: SAddressBody,
  })
  .refine((b) => Boolean(b.cpf?.trim()) || Boolean(b.cnpj?.trim()), {
    message: 'At least one of CPF or CNPJ is required',
    path: ['cpf'],
  });

export type TCreateClient = z.infer<typeof SCreateClient>;

export class CreateClientBodyDto extends createZodDto(SCreateClient) {}
