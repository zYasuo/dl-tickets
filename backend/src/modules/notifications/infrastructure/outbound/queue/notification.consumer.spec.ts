import { Logger } from '@nestjs/common';
import { NotificationConsumer } from './notification.consumer';
import { NotificationJobName } from './notification-queue.adapter';
import type { SendNotificationUseCase } from 'src/modules/notifications/application/use-case/send-notification.use-case';
import type { SendPasswordResetEmailUseCase } from 'src/modules/notifications/application/use-case/send-password-reset-email.use-case';

describe('NotificationConsumer', () => {
  let sendNotification: { execute: jest.Mock };
  let sendPasswordReset: { execute: jest.Mock };
  let consumer: NotificationConsumer;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    sendNotification = { execute: jest.fn().mockResolvedValue(undefined) };
    sendPasswordReset = { execute: jest.fn().mockResolvedValue(undefined) };
    consumer = new NotificationConsumer(
      sendNotification as unknown as SendNotificationUseCase,
      sendPasswordReset as unknown as SendPasswordResetEmailUseCase,
    );
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('dispatches ticket.created to SendNotificationUseCase', async () => {
    await consumer.process({
      name: NotificationJobName.TICKET_CREATED,
      data: { notificationId: 'nid-1' },
    } as never);

    expect(sendNotification.execute).toHaveBeenCalledWith('nid-1');
    expect(sendPasswordReset.execute).not.toHaveBeenCalled();
  });

  it('dispatches password.reset to SendPasswordResetEmailUseCase', async () => {
    await consumer.process({
      name: NotificationJobName.PASSWORD_RESET,
      data: { email: 'a@b.com', resetToken: 'tok', userId: 'uuid' },
    } as never);

    expect(sendPasswordReset.execute).toHaveBeenCalledWith({
      email: 'a@b.com',
      resetToken: 'tok',
    });
    expect(sendNotification.execute).not.toHaveBeenCalled();
  });

  it('logs warning for unknown job name without throwing', async () => {
    await expect(
      consumer.process({ name: 'unknown.job', data: {} } as never),
    ).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('unknown.job'));
    expect(sendNotification.execute).not.toHaveBeenCalled();
    expect(sendPasswordReset.execute).not.toHaveBeenCalled();
  });
});
