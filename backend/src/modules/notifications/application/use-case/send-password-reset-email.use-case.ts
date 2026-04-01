import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SendPasswordResetEmailUseCase {
  private readonly logger = new Logger(SendPasswordResetEmailUseCase.name);

  execute(payload: { email: string; resetToken: string }): Promise<void> {
    const subject = 'Password recovery — dl-tickets';
    const body = `You requested a password reset. Use this link to set a new password (valid for 1 hour):\n\nReset token: ${payload.resetToken}\n\nIf you did not request this, you can ignore this email.`;

    this.logger.log(`[Password reset email] to=${payload.email} subject="${subject}"\n${body}`);
    return Promise.resolve();
  }
}
