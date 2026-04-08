import { AUTH_API_ERROR_CODES } from '../errors';
import type { PasswordHasherPort } from 'src/modules/users/domain/ports/security/password-hasher.port';
import type { UserCredentialRepositoryPort } from 'src/modules/users/domain/ports/repository/user-credential.repository.port';
import type { TokenProviderPort } from '../../domain/ports/security/token-provider.port';
import type { PasswordResetRepositoryPort } from '../../domain/ports/repository/password-reset.repository.port';
import type { RefreshTokenRepositoryPort } from '../../domain/ports/repository/refresh-token.repository.port';
import { PasswordResetEntity } from '../../domain/entities/password-reset.entity';
import { ResetPasswordUseCase } from './reset-password.use-case';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let tokenProvider: { hashToken: jest.Mock };
  let passwordResetRepository: {
    findByTokenHash: jest.Mock;
    markAsUsed: jest.Mock;
  };
  let refreshTokenRepository: { revokeAllByUserId: jest.Mock };
  let credentialRepository: {
    updatePasswordHash: jest.Mock;
    clearLoginLockout: jest.Mock;
  };
  let passwordHasher: { hash: jest.Mock };

  const future = new Date('2030-01-01T00:00:00.000Z');
  const past = new Date('2020-01-01T00:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T00:00:00.000Z'));

    tokenProvider = { hashToken: jest.fn().mockReturnValue('h') };
    passwordResetRepository = {
      findByTokenHash: jest.fn(),
      markAsUsed: jest.fn(),
    };
    refreshTokenRepository = { revokeAllByUserId: jest.fn() };
    credentialRepository = {
      updatePasswordHash: jest.fn().mockResolvedValue(undefined),
      clearLoginLockout: jest.fn().mockResolvedValue(undefined),
    };
    passwordHasher = { hash: jest.fn().mockResolvedValue('new-hash') };

    useCase = new ResetPasswordUseCase(
      tokenProvider as unknown as TokenProviderPort,
      passwordResetRepository as unknown as PasswordResetRepositoryPort,
      refreshTokenRepository as unknown as RefreshTokenRepositoryPort,
      credentialRepository as unknown as UserCredentialRepositoryPort,
      passwordHasher as unknown as PasswordHasherPort,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('throws when reset record not found', async () => {
    passwordResetRepository.findByTokenHash.mockResolvedValue(null);

    await expect(
      useCase.execute({ token: 't', newPassword: 'newPassword12' }),
    ).rejects.toMatchObject({ code: AUTH_API_ERROR_CODES.INVALID_RESET_TOKEN });

    expect(credentialRepository.updatePasswordHash).not.toHaveBeenCalled();
  });

  it('throws when token already used', async () => {
    passwordResetRepository.findByTokenHash.mockResolvedValue(
      PasswordResetEntity.create({
        id: 1,
        tokenHash: 'h',
        userId: 9,
        expiresAt: future,
        usedAt: new Date(),
        createdAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({ token: 't', newPassword: 'newPassword12' }),
    ).rejects.toMatchObject({ code: AUTH_API_ERROR_CODES.INVALID_RESET_TOKEN });
  });

  it('throws when token expired', async () => {
    passwordResetRepository.findByTokenHash.mockResolvedValue(
      PasswordResetEntity.create({
        id: 1,
        tokenHash: 'h',
        userId: 9,
        expiresAt: past,
        usedAt: null,
        createdAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({ token: 't', newPassword: 'newPassword12' }),
    ).rejects.toMatchObject({ code: AUTH_API_ERROR_CODES.INVALID_RESET_TOKEN });
  });

  it('updates password, marks used and revokes refresh tokens on success', async () => {
    passwordResetRepository.findByTokenHash.mockResolvedValue(
      PasswordResetEntity.create({
        id: 7,
        tokenHash: 'h',
        userId: 99,
        expiresAt: future,
        usedAt: null,
        createdAt: new Date(),
      }),
    );

    await useCase.execute({ token: 'raw', newPassword: 'newPassword12' });

    expect(tokenProvider.hashToken).toHaveBeenCalledWith('raw');
    expect(passwordHasher.hash).toHaveBeenCalledWith('newPassword12');
    expect(credentialRepository.updatePasswordHash).toHaveBeenCalledWith(99, 'new-hash');
    expect(credentialRepository.clearLoginLockout).toHaveBeenCalledWith(99);
    expect(passwordResetRepository.markAsUsed).toHaveBeenCalledWith(7);
    expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(99);
  });
});
