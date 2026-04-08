import { randomUUID } from 'node:crypto';
import { resolveApplicationErrorHttp } from 'src/common/errors/application';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import type { UserCredentialRepositoryPort } from 'src/modules/users/domain/ports/repository/user-credential.repository.port';
import type { PasswordHasherPort } from 'src/modules/users/domain/ports/security/password-hasher.port';
import type { SessionTokenIssuerPort } from '../../domain/ports/security/session-token-issuer.port';
import { AUTH_API_ERROR_CODES } from '../auth-api-error-codes';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: {
    findByEmail: jest.Mock;
    getInternalIdByUuid: jest.Mock;
  };
  let credentialRepository: {
    findByUserId: jest.Mock;
    recordFailedLoginAttempt: jest.Mock;
    clearLoginLockout: jest.Mock;
  };
  let passwordHasher: { compare: jest.Mock };
  let sessionTokenIssuer: { issue: jest.Mock };

  const now = new Date('2025-01-01T00:00:00.000Z');
  const uuid = randomUUID();

  const makeCredential = (overrides: Record<string, unknown> = {}) => ({
    passwordHash: 'stored-hash',
    failedLoginAttempts: 0,
    lockedUntil: null,
    ...overrides,
  });

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      getInternalIdByUuid: jest.fn(),
    };
    credentialRepository = {
      findByUserId: jest.fn().mockResolvedValue(makeCredential()),
      recordFailedLoginAttempt: jest.fn().mockResolvedValue(undefined),
      clearLoginLockout: jest.fn().mockResolvedValue(undefined),
    };
    passwordHasher = { compare: jest.fn() };
    sessionTokenIssuer = {
      issue: jest.fn().mockResolvedValue({
        accessToken: 'access.jwt',
        refreshToken: 'refresh-raw',
      }),
    };

    useCase = new LoginUseCase(
      userRepository as unknown as UserRepositoryPort,
      credentialRepository as unknown as UserCredentialRepositoryPort,
      passwordHasher as unknown as PasswordHasherPort,
      sessionTokenIssuer as unknown as SessionTokenIssuerPort,
    );
  });

  it('throws Unauthorized when email not found (runs dummy compare)', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'any' }),
    ).rejects.toMatchObject({ code: AUTH_API_ERROR_CODES.INVALID_CREDENTIALS });

    expect(passwordHasher.compare).toHaveBeenCalled();
    expect(sessionTokenIssuer.issue).not.toHaveBeenCalled();
  });

  it('throws Unauthorized when password wrong', async () => {
    userRepository.findByEmail.mockResolvedValue(
      UserEntity.create({
        id: uuid,
        name: 'A',
        email: 'a@b.com',
        createdAt: now,
        updatedAt: now,
      }),
    );
    userRepository.getInternalIdByUuid.mockResolvedValue(42);
    credentialRepository.findByUserId.mockResolvedValue(makeCredential());
    passwordHasher.compare.mockResolvedValueOnce(false);

    await expect(useCase.execute({ email: 'a@b.com', password: 'wrong' })).rejects.toMatchObject({
      code: AUTH_API_ERROR_CODES.INVALID_CREDENTIALS,
    });

    expect(credentialRepository.recordFailedLoginAttempt).toHaveBeenCalledWith(42);
    expect(sessionTokenIssuer.issue).not.toHaveBeenCalled();
  });

  it('throws TooManyRequests when account locked', async () => {
    const lockedUntil = new Date(Date.now() + 120_000);
    userRepository.findByEmail.mockResolvedValue(
      UserEntity.create({
        id: uuid,
        name: 'A',
        email: 'a@b.com',
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    );
    userRepository.getInternalIdByUuid.mockResolvedValue(1);
    credentialRepository.findByUserId.mockResolvedValue(makeCredential({ lockedUntil }));

    await expect(useCase.execute({ email: 'a@b.com', password: 'ok' })).rejects.toMatchObject({
      code: AUTH_API_ERROR_CODES.ACCOUNT_LOCKED,
    });

    expect(resolveApplicationErrorHttp(AUTH_API_ERROR_CODES.ACCOUNT_LOCKED)?.statusCode).toBe(429);

    expect(passwordHasher.compare).not.toHaveBeenCalled();
    expect(credentialRepository.recordFailedLoginAttempt).not.toHaveBeenCalled();
  });

  it('clears expired lockout then validates password', async () => {
    const lockedUntil = new Date(now.getTime() - 60_000);
    userRepository.findByEmail.mockResolvedValue(
      UserEntity.create({
        id: uuid,
        name: 'A',
        email: 'a@b.com',
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    );
    userRepository.getInternalIdByUuid.mockResolvedValue(7);
    credentialRepository.findByUserId.mockResolvedValue(makeCredential({ lockedUntil }));
    passwordHasher.compare.mockResolvedValueOnce(true);

    await useCase.execute({ email: 'a@b.com', password: 'ok' });

    expect(credentialRepository.clearLoginLockout).toHaveBeenCalledWith(7);
    expect(sessionTokenIssuer.issue).toHaveBeenCalled();
  });

  it('throws Forbidden when email not verified', async () => {
    userRepository.findByEmail.mockResolvedValue(
      UserEntity.create({
        id: uuid,
        name: 'A',
        email: 'a@b.com',
        emailVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    );
    userRepository.getInternalIdByUuid.mockResolvedValue(2);
    credentialRepository.findByUserId.mockResolvedValue(makeCredential());
    passwordHasher.compare.mockResolvedValueOnce(true);

    await expect(useCase.execute({ email: 'a@b.com', password: 'ok' })).rejects.toMatchObject({
      code: AUTH_API_ERROR_CODES.EMAIL_NOT_VERIFIED,
    });

    expect(credentialRepository.clearLoginLockout).toHaveBeenCalledWith(2);
    expect(sessionTokenIssuer.issue).not.toHaveBeenCalled();
  });

  it('returns tokens when credentials valid', async () => {
    userRepository.findByEmail.mockResolvedValue(
      UserEntity.create({
        id: uuid,
        name: 'A',
        email: 'a@b.com',
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    );
    passwordHasher.compare.mockResolvedValueOnce(true);
    userRepository.getInternalIdByUuid.mockResolvedValue(1);
    credentialRepository.findByUserId.mockResolvedValue(makeCredential());

    const result = await useCase.execute({ email: 'a@b.com', password: 'ok' });

    expect(result.accessToken).toBe('access.jwt');
    expect(result.refreshToken).toBe('refresh-raw');
    expect(sessionTokenIssuer.issue).toHaveBeenCalledWith(
      expect.objectContaining({
        userUuid: uuid,
        email: 'a@b.com',
        internalUserId: 1,
      }),
    );
    expect(sessionTokenIssuer.issue.mock.calls[0][0].familyId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(credentialRepository.clearLoginLockout).toHaveBeenCalledWith(1);
  });
});
