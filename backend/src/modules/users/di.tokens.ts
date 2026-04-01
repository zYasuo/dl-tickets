import type { InjectionToken } from '@nestjs/common';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import type { PasswordHasherPort } from 'src/modules/users/domain/ports/security/password-hasher.port';

export const USER_REPOSITORY: InjectionToken<UserRepositoryPort> = Symbol('USER_REPOSITORY');

export const PASSWORD_HASHER: InjectionToken<PasswordHasherPort> = Symbol('PASSWORD_HASHER');
