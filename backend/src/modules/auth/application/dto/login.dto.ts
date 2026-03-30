import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const SLogin = z.object({
  email: z.email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type TLogin = z.infer<typeof SLogin>;

export class LoginBodyDto extends createZodDto(SLogin) {}
