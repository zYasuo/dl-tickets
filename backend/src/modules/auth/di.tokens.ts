import type { InjectionToken } from '@nestjs/common';
import type { RefreshTokenRepositoryPort } from 'src/modules/auth/domain/ports/repository/refresh-token.repository.port';
import type { PasswordResetRepositoryPort } from 'src/modules/auth/domain/ports/repository/password-reset.repository.port';
import type { TokenProviderPort } from 'src/modules/auth/domain/ports/security/token-provider.port';

export const REFRESH_TOKEN_REPOSITORY: InjectionToken<RefreshTokenRepositoryPort> = Symbol(
  'REFRESH_TOKEN_REPOSITORY',
);

export const PASSWORD_RESET_REPOSITORY: InjectionToken<PasswordResetRepositoryPort> = Symbol(
  'PASSWORD_RESET_REPOSITORY',
);

export const TOKEN_PROVIDER: InjectionToken<TokenProviderPort> = Symbol('TOKEN_PROVIDER');
