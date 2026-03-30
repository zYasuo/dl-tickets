import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import type { TokenProviderPort } from '../../domain/ports/security/token-provider.port';
import type { RefreshTokenRepositoryPort } from '../../domain/ports/repository/refresh-token.repository.port';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenUseCase } from './refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let tokenProvider: {
    hashToken: jest.Mock;
    signAccessToken: jest.Mock;
    generateRefreshToken: jest.Mock;
  };
  let refreshTokenRepository: {
    findByTokenHash: jest.Mock;
    revokeById: jest.Mock;
    revokeByFamily: jest.Mock;
    create: jest.Mock;
  };
  let userRepository: { findByInternalId: jest.Mock };
  let configService: { get: jest.Mock };

  const familyId = randomUUID();
  const userUuid = randomUUID();
  const now = new Date();
  const future = new Date(Date.now() + 86400000);

  beforeEach(() => {
    tokenProvider = {
      hashToken: jest.fn(),
      signAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
    };
    refreshTokenRepository = {
      findByTokenHash: jest.fn(),
      revokeById: jest.fn(),
      revokeByFamily: jest.fn(),
      create: jest.fn(),
    };
    userRepository = { findByInternalId: jest.fn() };
    configService = {
      get: jest.fn().mockReturnValue({ refreshExpirationDays: 7 }),
    };

    useCase = new RefreshTokenUseCase(
      tokenProvider as unknown as TokenProviderPort,
      refreshTokenRepository as unknown as RefreshTokenRepositoryPort,
      userRepository as unknown as UserRepositoryPort,
      configService as unknown as ConfigService,
    );
  });

  it('throws when refresh token empty', async () => {
    await expect(useCase.execute('')).rejects.toThrow(UnauthorizedException);
    await expect(useCase.execute('   ')).rejects.toThrow(UnauthorizedException);
  });

  it('revokes family when token already revoked (reuse)', async () => {
    const stored = RefreshTokenEntity.create({
      id: 1,
      tokenHash: 'h',
      familyId,
      userId: 1,
      expiresAt: future,
      revokedAt: now,
      createdAt: now,
    });
    tokenProvider.hashToken.mockReturnValueOnce('h');
    refreshTokenRepository.findByTokenHash.mockResolvedValue(stored);

    await expect(useCase.execute('raw-token')).rejects.toThrow(UnauthorizedException);

    expect(refreshTokenRepository.revokeByFamily).toHaveBeenCalledWith(familyId);
    expect(refreshTokenRepository.revokeById).not.toHaveBeenCalled();
  });

  it('rotates token when valid', async () => {
    const stored = RefreshTokenEntity.create({
      id: 1,
      tokenHash: 'h',
      familyId,
      userId: 1,
      expiresAt: future,
      revokedAt: null,
      createdAt: now,
    });
    tokenProvider.hashToken.mockReturnValueOnce('h').mockReturnValueOnce('h2');
    refreshTokenRepository.findByTokenHash.mockResolvedValue(stored);
    userRepository.findByInternalId.mockResolvedValue(
      UserEntity.create({
        id: userUuid,
        name: 'U',
        email: 'u@e.com',
        password: 'password12',
        createdAt: now,
        updatedAt: now,
      }),
    );
    tokenProvider.signAccessToken.mockResolvedValue('new.access');
    tokenProvider.generateRefreshToken.mockReturnValue('new-raw');
    refreshTokenRepository.create.mockResolvedValue({});

    const result = await useCase.execute('raw-token');

    expect(result.accessToken).toBe('new.access');
    expect(result.refreshToken).toBe('new-raw');
    expect(refreshTokenRepository.revokeById).toHaveBeenCalledWith(1);
    expect(refreshTokenRepository.create).toHaveBeenCalled();
  });
});
