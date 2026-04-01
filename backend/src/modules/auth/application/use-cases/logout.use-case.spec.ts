import { randomUUID } from 'node:crypto';
import type { TokenProviderPort } from '../../domain/ports/security/token-provider.port';
import type { RefreshTokenRepositoryPort } from '../../domain/ports/repository/refresh-token.repository.port';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let tokenProvider: { hashToken: jest.Mock };
  let refreshTokenRepository: {
    findByTokenHash: jest.Mock;
    revokeByFamily: jest.Mock;
  };

  beforeEach(() => {
    tokenProvider = { hashToken: jest.fn() };
    refreshTokenRepository = {
      findByTokenHash: jest.fn(),
      revokeByFamily: jest.fn(),
    };
    useCase = new LogoutUseCase(
      tokenProvider as unknown as TokenProviderPort,
      refreshTokenRepository as unknown as RefreshTokenRepositoryPort,
    );
  });

  it('returns without calling repository when refresh token is empty', async () => {
    await useCase.execute('');
    expect(tokenProvider.hashToken).not.toHaveBeenCalled();
    expect(refreshTokenRepository.findByTokenHash).not.toHaveBeenCalled();
  });

  it('revokes family when token exists and is not revoked', async () => {
    const familyId = randomUUID();
    tokenProvider.hashToken.mockReturnValue('hash-1');
    refreshTokenRepository.findByTokenHash.mockResolvedValue(
      RefreshTokenEntity.create({
        id: 1,
        tokenHash: 'hash-1',
        familyId,
        userId: 10,
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        createdAt: new Date(),
      }),
    );

    await useCase.execute('raw-refresh');

    expect(tokenProvider.hashToken).toHaveBeenCalledWith('raw-refresh');
    expect(refreshTokenRepository.revokeByFamily).toHaveBeenCalledWith(familyId);
  });

  it('does not revoke when token not found', async () => {
    tokenProvider.hashToken.mockReturnValue('hash-x');
    refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

    await useCase.execute('raw');

    expect(refreshTokenRepository.revokeByFamily).not.toHaveBeenCalled();
  });

  it('does not revoke when token already revoked', async () => {
    tokenProvider.hashToken.mockReturnValue('hash-1');
    refreshTokenRepository.findByTokenHash.mockResolvedValue(
      RefreshTokenEntity.create({
        id: 1,
        tokenHash: 'hash-1',
        familyId: 'fam',
        userId: 10,
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date(),
        createdAt: new Date(),
      }),
    );

    await useCase.execute('raw');

    expect(refreshTokenRepository.revokeByFamily).not.toHaveBeenCalled();
  });
});
