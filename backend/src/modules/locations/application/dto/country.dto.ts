import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const SCreateCountry = z.object({
  name: z.string().min(1).max(255),
});

export const SUpdateCountry = z.object({
  name: z.string().min(1).max(255),
});

export type CreateCountryBody = z.infer<typeof SCreateCountry>;
export type UpdateCountryBody = z.infer<typeof SUpdateCountry>;

export class CreateCountryBodyDto extends createZodDto(SCreateCountry) {}
export class UpdateCountryBodyDto extends createZodDto(SUpdateCountry) {}
