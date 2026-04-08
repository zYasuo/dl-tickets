import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const SCreateState = z.object({
  countryUuid: z.string().uuid(),
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(10).optional(),
});

export const SUpdateState = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(10).optional().nullable(),
});

export const SListStatesQuery = z.object({
  countryUuid: z.uuid(),
});

export type CreateStateBody = z.infer<typeof SCreateState>;
export type UpdateStateBody = z.infer<typeof SUpdateState>;
export type ListStatesQuery = z.infer<typeof SListStatesQuery>;

export class CreateStateBodyDto extends createZodDto(SCreateState) {}
export class UpdateStateBodyDto extends createZodDto(SUpdateState) {}
export class ListStatesQueryDto extends createZodDto(SListStatesQuery) {}
