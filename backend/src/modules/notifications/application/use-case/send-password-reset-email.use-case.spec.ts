import { Logger } from '@nestjs/common';
import { SendPasswordResetEmailUseCase } from './send-password-reset-email.use-case';

describe('SendPasswordResetEmailUseCase', () => {
  let useCase: SendPasswordResetEmailUseCase;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    useCase = new SendPasswordResetEmailUseCase();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('resolves and logs email and token (no persistence beyond log)', async () => {
    await expect(
      useCase.execute({ email: 'u@example.com', resetToken: 'secret-token' }),
    ).resolves.toBeUndefined();

    expect(logSpy).toHaveBeenCalled();
    const arg = String(logSpy.mock.calls[0][0]);
    expect(arg).toContain('u@example.com');
    expect(arg).toContain('secret-token');
  });
});
