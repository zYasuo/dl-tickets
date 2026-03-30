import type { InjectionToken } from '@nestjs/common';
import type { PasswordHasherPort } from 'src/modules/users/domain/ports/security/password-hasher.port';
import type { TokenProviderPort } from 'src/modules/auth/domain/ports/security/token-provider.port';

export const PASSWORD_HASHER: InjectionToken<PasswordHasherPort> =
  Symbol('PASSWORD_HASHER');

export const TOKEN_PROVIDER: InjectionToken<TokenProviderPort> =
  Symbol('TOKEN_PROVIDER');
