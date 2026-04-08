import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const SCreateCity = z.object({
  stateUuid: z.string().uuid(),
  name: z.string().min(1).max(255),
});

export const SUpdateCity = z.object({
  name: z.string().min(1).max(255),
});

export const SListCitiesQuery = z.object({
  stateUuid: z.string().uuid(),
});

export type CreateCityBody = z.infer<typeof SCreateCity>;
export type UpdateCityBody = z.infer<typeof SUpdateCity>;
export type ListCitiesQuery = z.infer<typeof SListCitiesQuery>;

export class CreateCityBodyDto extends createZodDto(SCreateCity) {}
export class UpdateCityBodyDto extends createZodDto(SUpdateCity) {}
export class ListCitiesQueryDto extends createZodDto(SListCitiesQuery) {}
