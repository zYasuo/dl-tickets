import { Inject, Injectable } from '@nestjs/common';
import { PASSWORD_RESET_REPOSITORY, TOKEN_PROVIDER } from '../../di.tokens';
import { NOTIFICATION_QUEUE_PORT } from 'src/modules/notifications/di.tokens';
import { USER_REPOSITORY } from 'src/modules/users/di.tokens';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import type { TokenProviderPort } from '../../domain/ports/security/token-provider.port';
import type { PasswordResetRepositoryPort } from '../../domain/ports/repository/password-reset.repository.port';
import type { NotificationQueuePort } from 'src/modules/notifications/domain/ports/queue/notification-queue.port';
import { PasswordResetEntity } from '../../domain/entities/password-reset.entity';
import type { RequestPasswordResetBody } from '../dto/request-password-reset.dto';

const RESPONSE_MESSAGE = 'If this email is registered, a recovery link will be sent';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(TOKEN_PROVIDER) private readonly tokenProvider: TokenProviderPort,
    @Inject(PASSWORD_RESET_REPOSITORY)
    private readonly passwordResetRepository: PasswordResetRepositoryPort,
    @Inject(NOTIFICATION_QUEUE_PORT)
    private readonly notificationQueue: NotificationQueuePort,
  ) {}

  async execute(input: RequestPasswordResetBody): Promise<string> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      return RESPONSE_MESSAGE;
    }

    const rawToken = this.tokenProvider.generateRefreshToken();
    const tokenHash = this.tokenProvider.hashToken(rawToken);
    const internalId = await this.userRepository.getInternalIdByUuid(user.id);

    await this.passwordResetRepository.create(
      PasswordResetEntity.create({
        id: 0,
        tokenHash,
        userId: internalId,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        usedAt: null,
        createdAt: new Date(),
      }),
    );

    await this.notificationQueue.enqueuePasswordReset({
      userId: user.id,
      email: user.email.value,
      resetToken: rawToken,
    });

    return RESPONSE_MESSAGE;
  }
}
