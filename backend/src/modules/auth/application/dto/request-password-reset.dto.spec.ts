import { SRequestPasswordReset } from './request-password-reset.dto';

describe('SRequestPasswordReset', () => {
  it('accepts valid email', () => {
    const r = SRequestPasswordReset.safeParse({ email: 'user@example.com' });
    expect(r.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = SRequestPasswordReset.safeParse({ email: 'not-an-email' });
    expect(r.success).toBe(false);
  });
});
