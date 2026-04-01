import { SResetPassword } from './reset-password.dto';

describe('SResetPassword', () => {
  it('accepts token and password meeting min length', () => {
    const r = SResetPassword.safeParse({ token: 'abc', newPassword: 'password12' });
    expect(r.success).toBe(true);
  });

  it('rejects empty token', () => {
    const r = SResetPassword.safeParse({ token: '', newPassword: 'password12' });
    expect(r.success).toBe(false);
  });

  it('rejects short password', () => {
    const r = SResetPassword.safeParse({ token: 'x', newPassword: 'short' });
    expect(r.success).toBe(false);
  });
});
