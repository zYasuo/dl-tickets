import { Inject, Injectable } from '@nestjs/common';
import { ApplicationException } from 'src/common/errors/application';
import {
  PASSWORD_RESET_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_PROVIDER,
} from '../../di.tokens';
import { PASSWORD_HASHER, USER_CREDENTIAL_REPOSITORY } from 'src/modules/users/di.tokens';
import type { PasswordHasherPort } from 'src/modules/users/domain/ports/security/password-hasher.port';
import type { UserCredentialRepositoryPort } from 'src/modules/users/domain/ports/repository/user-credential.repository.port';
import type { TokenProviderPort } from '../../domain/ports/security/token-provider.port';
import type { PasswordResetRepositoryPort } from '../../domain/ports/repository/password-reset.repository.port';
import type { RefreshTokenRepositoryPort } from '../../domain/ports/repository/refresh-token.repository.port';
import type { ResetPasswordBody } from '../dto/reset-password.dto';
import { AUTH_API_ERROR_CODES } from '../errors';

const INVALID_RESET_TOKEN_MSG = 'Invalid or expired reset token';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(TOKEN_PROVIDER) private readonly tokenProvider: TokenProviderPort,
    @Inject(PASSWORD_RESET_REPOSITORY)
    private readonly passwordResetRepository: PasswordResetRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(USER_CREDENTIAL_REPOSITORY)
    private readonly credentialRepository: UserCredentialRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: ResetPasswordBody): Promise<void> {
    const tokenHash = this.tokenProvider.hashToken(input.token);
    const reset = await this.passwordResetRepository.findByTokenHash(tokenHash);

    if (!reset) {
      throw new ApplicationException(
        AUTH_API_ERROR_CODES.INVALID_RESET_TOKEN,
        INVALID_RESET_TOKEN_MSG,
      );
    }

    if (reset.isUsed) {
      throw new ApplicationException(
        AUTH_API_ERROR_CODES.INVALID_RESET_TOKEN,
        INVALID_RESET_TOKEN_MSG,
      );
    }

    if (reset.isExpired) {
      throw new ApplicationException(
        AUTH_API_ERROR_CODES.INVALID_RESET_TOKEN,
        INVALID_RESET_TOKEN_MSG,
      );
    }

    const hashedPassword = await this.passwordHasher.hash(input.newPassword);

    await this.credentialRepository.updatePasswordHash(reset.userId, hashedPassword);
    await this.credentialRepository.clearLoginLockout(reset.userId);
    await this.passwordResetRepository.markAsUsed(reset.id);
    await this.refreshTokenRepository.revokeAllByUserId(reset.userId);
  }
}
