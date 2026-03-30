import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';
import { Email } from '../../domain/vo/email.vo';
import { Name } from '../../domain/vo/name.vo';
import { Password } from '../../domain/vo/password.vo';

export const SCreateUser = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(Name.MAX_LENGTH, 'Name must be less than 255 characters'),
  email: z.email().max(Email.MAX_LENGTH, 'Email must be less than 254 characters'),
  password: z
    .string()
    .min(Password.MIN_LENGTH, 'Password must be at least 8 characters')
    .max(Password.MAX_LENGTH, 'Password must be less than 255 characters'),
});

export type TCreateUser = z.infer<typeof SCreateUser>;

export class CreateUserBodyDto extends createZodDto(SCreateUser) {}
