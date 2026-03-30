import { Inject, Injectable } from '@nestjs/common';
import { REFRESH_TOKEN_REPOSITORY, TOKEN_PROVIDER } from 'src/di/tokens';
import type { TokenProviderPort } from '../../domain/ports/security/token-provider.port';
import type { RefreshTokenRepositoryPort } from '../../domain/ports/repository/refresh-token.repository.port';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(TOKEN_PROVIDER) private readonly tokenProvider: TokenProviderPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
  ) {}

  async execute(rawRefreshToken: string): Promise<void> {
    if (!rawRefreshToken) return;

    const tokenHash = this.tokenProvider.hashToken(rawRefreshToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (stored && !stored.isRevoked) {
      await this.refreshTokenRepository.revokeByFamily(stored.familyId);
    }
  }
}
