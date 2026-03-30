import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PASSWORD_HASHER,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_PROVIDER,
  USER_REPOSITORY,
} from 'src/di/tokens';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import type { PasswordHasherPort } from 'src/modules/users/domain/ports/security/password-hasher.port';
import type { TokenProviderPort } from '../../domain/ports/security/token-provider.port';
import type { RefreshTokenRepositoryPort } from '../../domain/ports/repository/refresh-token.repository.port';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import type { TLogin } from '../dto/login.dto';
import { randomUUID } from 'node:crypto';
import type { IAuthConfig } from 'src/config/auth.config';

const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=4$JMdI74dxqkC6ES1zzlG+rQ$O2PXX5Ze/TEmBGUuBZn5rpPghLhuoDNZXurwGg+CtGU';
const INVALID_CREDENTIALS_MSG = 'Invalid email or password';

export type TLoginResult = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_PROVIDER) private readonly tokenProvider: TokenProviderPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: TLogin): Promise<TLoginResult> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      await this.passwordHasher.compare(input.password, DUMMY_HASH);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MSG);
    }

    const passwordValid = await this.passwordHasher.compare(
      input.password,
      user.password.value,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MSG);
    }

    const internalId = await this.userRepository.getInternalIdByUuid(user.id);

    const accessToken = await this.tokenProvider.signAccessToken({
      sub: user.id,
      email: user.email.value,
    });

    const rawRefreshToken = this.tokenProvider.generateRefreshToken();
    const tokenHash = this.tokenProvider.hashToken(rawRefreshToken);
    const familyId = randomUUID();
    const authConfig = this.configService.get<IAuthConfig>('auth')!;
    const expiresAt = new Date(
      Date.now() + authConfig.refreshExpirationDays * 24 * 60 * 60 * 1000,
    );

    await this.refreshTokenRepository.create(
      RefreshTokenEntity.create({
        id: 0,
        tokenHash,
        familyId,
        userId: internalId,
        expiresAt,
        revokedAt: null,
        createdAt: new Date(),
      }),
    );

    return { accessToken, refreshToken: rawRefreshToken };
  }
}
