import { randomUUID } from 'node:crypto';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import type { NotificationQueuePort } from 'src/modules/notifications/domain/ports/queue/notification-queue.port';
import type { TokenProviderPort } from '../../domain/ports/security/token-provider.port';
import type { PasswordResetRepositoryPort } from '../../domain/ports/repository/password-reset.repository.port';
import { RequestPasswordResetUseCase } from './request-password-reset.use-case';

const FIXED_MESSAGE = 'If this email is registered, a recovery link will be sent';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
  let userRepository: {
    findByEmail: jest.Mock;
    getInternalIdByUuid: jest.Mock;
  };
  let tokenProvider: { generateRefreshToken: jest.Mock; hashToken: jest.Mock };
  let passwordResetRepository: { create: jest.Mock };
  let notificationQueue: { enqueuePasswordReset: jest.Mock };

  const now = new Date('2025-06-01T12:00:00.000Z');
  const userUuid = randomUUID();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    userRepository = {
      findByEmail: jest.fn(),
      getInternalIdByUuid: jest.fn(),
    };
    tokenProvider = {
      generateRefreshToken: jest.fn().mockReturnValue('plain-reset-token'),
      hashToken: jest.fn().mockReturnValue('hashed-token'),
    };
    passwordResetRepository = { create: jest.fn().mockResolvedValue(undefined) };
    notificationQueue = { enqueuePasswordReset: jest.fn().mockResolvedValue(undefined) };

    useCase = new RequestPasswordResetUseCase(
      userRepository as unknown as UserRepositoryPort,
      tokenProvider as unknown as TokenProviderPort,
      passwordResetRepository as unknown as PasswordResetRepositoryPort,
      notificationQueue as unknown as NotificationQueuePort,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns same message when user does not exist (no enumeration)', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    const msg = await useCase.execute({ email: 'nobody@example.com' });

    expect(msg).toBe(FIXED_MESSAGE);
    expect(passwordResetRepository.create).not.toHaveBeenCalled();
    expect(notificationQueue.enqueuePasswordReset).not.toHaveBeenCalled();
  });

  it('creates reset record and enqueues email with plain token; return value is only fixed message', async () => {
    userRepository.findByEmail.mockResolvedValue(
      UserEntity.create({
        id: userUuid,
        name: 'U',
        email: 'u@example.com',
        password: 'hashedpass',
        createdAt: now,
        updatedAt: now,
      }),
    );
    userRepository.getInternalIdByUuid.mockResolvedValue(42);

    const msg = await useCase.execute({ email: 'u@example.com' });

    expect(msg).toBe(FIXED_MESSAGE);
    expect(tokenProvider.generateRefreshToken).toHaveBeenCalled();
    expect(tokenProvider.hashToken).toHaveBeenCalledWith('plain-reset-token');
    expect(passwordResetRepository.create).toHaveBeenCalled();
    expect(notificationQueue.enqueuePasswordReset).toHaveBeenCalledWith({
      userId: userUuid,
      email: 'u@example.com',
      resetToken: 'plain-reset-token',
    });
    // Return value must not expose the token
    expect(msg).not.toContain('plain-reset-token');
  });
});
