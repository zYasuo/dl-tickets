import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REFRESH_TOKEN_REPOSITORY, TOKEN_PROVIDER, USER_REPOSITORY } from 'src/di/tokens';
import type { TokenProviderPort } from '../../domain/ports/security/token-provider.port';
import type { RefreshTokenRepositoryPort } from '../../domain/ports/repository/refresh-token.repository.port';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import type { IAuthConfig } from 'src/config/auth.config';

export type TRefreshResult = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(TOKEN_PROVIDER) private readonly tokenProvider: TokenProviderPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(rawRefreshToken: string): Promise<TRefreshResult> {
    if (!rawRefreshToken?.trim()) {
      throw new UnauthorizedException();
    }

    const tokenHash = this.tokenProvider.hashToken(rawRefreshToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!stored) {
      throw new UnauthorizedException();
    }

    if (stored.isRevoked) {
      await this.refreshTokenRepository.revokeByFamily(stored.familyId);
      throw new UnauthorizedException();
    }

    if (stored.isExpired) {
      throw new UnauthorizedException();
    }

    await this.refreshTokenRepository.revokeById(stored.id);

    const user = await this.userRepository.findByInternalId(stored.userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const accessToken = await this.tokenProvider.signAccessToken({
      sub: user.id,
      email: user.email.value,
    });

    const newRawRefreshToken = this.tokenProvider.generateRefreshToken();
    const newTokenHash = this.tokenProvider.hashToken(newRawRefreshToken);
    const authConfig = this.configService.get<IAuthConfig>('auth')!;
    const expiresAt = new Date(
      Date.now() + authConfig.refreshExpirationDays * 24 * 60 * 60 * 1000,
    );

    await this.refreshTokenRepository.create(
      RefreshTokenEntity.create({
        id: 0,
        tokenHash: newTokenHash,
        familyId: stored.familyId,
        userId: stored.userId,
        expiresAt,
        revokedAt: null,
        createdAt: new Date(),
      }),
    );

    return { accessToken, refreshToken: newRawRefreshToken };
  }
}
