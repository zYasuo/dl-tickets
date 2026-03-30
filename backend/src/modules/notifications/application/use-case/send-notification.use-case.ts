import { Inject, Injectable, Logger } from '@nestjs/common';
import type { NotificationRepositoryPort } from '../../domain/ports/repository/notification.repository.port';
import { NOTIFICATION_REPOSITORY } from 'src/di/tokens';

@Injectable()
export class SendNotificationUseCase {
  private readonly logger = new Logger(SendNotificationUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepositoryPort,
  ) {}

  async execute(notificationId: string): Promise<void> {
    const notification =
      await this.notificationRepository.findById(notificationId);

    if (!notification) {
      this.logger.warn(`Notification ${notificationId} not found, skipping`);
      return;
    }

    try {
      this.logger.log(
        `[EMAIL] To: ${notification.recipient} | ` +
          `Subject: "${notification.subject}" | ` +
          `Ticket: ${notification.ticketId}`,
      );

      const sent = notification.markAsSent();
      await this.notificationRepository.updateStatus(sent);

      this.logger.log(
        `[EMAIL] Notification ${notificationId} sent successfully`,
      );
    } catch (error) {
      this.logger.error(
        `[EMAIL] Failed to send notification ${notificationId}`,
        error instanceof Error ? error.stack : undefined,
      );

      const failed = notification.markAsFailed();
      await this.notificationRepository.updateStatus(failed);
    }
  }
}
