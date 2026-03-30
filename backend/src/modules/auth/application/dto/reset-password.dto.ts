import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';
import { Password } from 'src/modules/users/domain/vo/password.vo';

export const SResetPassword = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z
    .string()
    .min(Password.MIN_LENGTH, `Password must be at least ${Password.MIN_LENGTH} characters`)
    .max(Password.MAX_LENGTH, `Password must be at most ${Password.MAX_LENGTH} characters`),
});

export type TResetPassword = z.infer<typeof SResetPassword>;

export class ResetPasswordBodyDto extends createZodDto(SResetPassword) {}
