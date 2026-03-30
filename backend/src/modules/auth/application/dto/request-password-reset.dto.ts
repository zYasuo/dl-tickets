import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const SRequestPasswordReset = z.object({
  email: z.email('Valid email is required'),
});

export type TRequestPasswordReset = z.infer<typeof SRequestPasswordReset>;

export class RequestPasswordResetBodyDto extends createZodDto(SRequestPasswordReset) {}
