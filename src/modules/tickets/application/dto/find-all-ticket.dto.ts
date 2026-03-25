import { z } from 'zod';

export const SFindAllTicket = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  cursor: z.uuid().optional(),
});

export type TFindAllTicket = z.infer<typeof SFindAllTicket>;
