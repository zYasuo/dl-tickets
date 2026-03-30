import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  PASSWORD_RESET_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_PROVIDER,
  USER_REPOSITORY,
} from 'src/di/tokens';
import type { PasswordHasherPort } from 'src/modules/users/domain/ports/security/password-hasher.port';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import type { TokenProviderPort } from '../../domain/ports/security/token-provider.port';
import type { PasswordResetRepositoryPort } from '../../domain/ports/repository/password-reset.repository.port';
import type { RefreshTokenRepositoryPort } from '../../domain/ports/repository/refresh-token.repository.port';
import type { TResetPassword } from '../dto/reset-password.dto';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(TOKEN_PROVIDER) private readonly tokenProvider: TokenProviderPort,
    @Inject(PASSWORD_RESET_REPOSITORY)
    private readonly passwordResetRepository: PasswordResetRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: TResetPassword): Promise<void> {
    const tokenHash = this.tokenProvider.hashToken(input.token);
    const reset = await this.passwordResetRepository.findByTokenHash(tokenHash);

    if (!reset) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (reset.isUsed) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (reset.isExpired) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await this.passwordHasher.hash(input.newPassword);

    await this.userRepository.updatePassword(reset.userId, hashedPassword);
    await this.passwordResetRepository.markAsUsed(reset.id);
    await this.refreshTokenRepository.revokeAllByUserId(reset.userId);
  }
}
