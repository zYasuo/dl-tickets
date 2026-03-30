import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import type { PasswordHasherPort } from 'src/modules/users/domain/ports/security/password-hasher.port';
import type { TokenProviderPort } from '../../domain/ports/security/token-provider.port';
import type { RefreshTokenRepositoryPort } from '../../domain/ports/repository/refresh-token.repository.port';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: {
    findByEmail: jest.Mock;
    getInternalIdByUuid: jest.Mock;
  };
  let passwordHasher: { compare: jest.Mock };
  let tokenProvider: {
    signAccessToken: jest.Mock;
    generateRefreshToken: jest.Mock;
    hashToken: jest.Mock;
  };
  let refreshTokenRepository: { create: jest.Mock };
  let configService: { get: jest.Mock };

  const now = new Date('2025-01-01T00:00:00.000Z');
  const uuid = randomUUID();

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      getInternalIdByUuid: jest.fn(),
    };
    passwordHasher = { compare: jest.fn() };
    tokenProvider = {
      signAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      hashToken: jest.fn(),
    };
    refreshTokenRepository = { create: jest.fn() };
    configService = {
      get: jest.fn().mockReturnValue({
        jwtSecret: 'x',
        accessExpirationSeconds: 900,
        refreshExpirationDays: 7,
      }),
    };

    useCase = new LoginUseCase(
      userRepository as unknown as UserRepositoryPort,
      passwordHasher as unknown as PasswordHasherPort,
      tokenProvider as unknown as TokenProviderPort,
      refreshTokenRepository as unknown as RefreshTokenRepositoryPort,
      configService as unknown as ConfigService,
    );
  });

  it('throws Unauthorized when email not found (runs dummy compare)', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'any' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(passwordHasher.compare).toHaveBeenCalled();
    expect(tokenProvider.signAccessToken).not.toHaveBeenCalled();
  });

  it('throws Unauthorized when password wrong', async () => {
    userRepository.findByEmail.mockResolvedValue(
      UserEntity.create({
        id: uuid,
        name: 'A',
        email: 'a@b.com',
        password: 'stored-hash',
        createdAt: now,
        updatedAt: now,
      }),
    );
    passwordHasher.compare.mockResolvedValueOnce(false);

    await expect(
      useCase.execute({ email: 'a@b.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(refreshTokenRepository.create).not.toHaveBeenCalled();
  });

  it('returns tokens when credentials valid', async () => {
    userRepository.findByEmail.mockResolvedValue(
      UserEntity.create({
        id: uuid,
        name: 'A',
        email: 'a@b.com',
        password: 'stored-hash',
        createdAt: now,
        updatedAt: now,
      }),
    );
    passwordHasher.compare.mockResolvedValueOnce(true);
    userRepository.getInternalIdByUuid.mockResolvedValue(1);
    tokenProvider.signAccessToken.mockResolvedValue('access.jwt');
    tokenProvider.generateRefreshToken.mockReturnValue('refresh-raw');
    tokenProvider.hashToken.mockReturnValue('refresh-hash');
    refreshTokenRepository.create.mockResolvedValue({});

    const result = await useCase.execute({ email: 'a@b.com', password: 'ok' });

    expect(result.accessToken).toBe('access.jwt');
    expect(result.refreshToken).toBe('refresh-raw');
    expect(tokenProvider.signAccessToken).toHaveBeenCalledWith({
      sub: uuid,
      email: 'a@b.com',
    });
    expect(refreshTokenRepository.create).toHaveBeenCalled();
  });
});
