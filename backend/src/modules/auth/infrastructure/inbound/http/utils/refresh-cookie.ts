import type { Response } from 'express';

export const REFRESH_TOKEN_COOKIE = 'refreshToken';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

export function readRefreshTokenFromRequest(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq);
    if (name !== REFRESH_TOKEN_COOKIE) continue;
    return decodeURIComponent(trimmed.slice(eq + 1));
  }
  return undefined;
}

export function setRefreshTokenCookie(res: Response, token: string, maxAgeMs: number): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeMs,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    path: REFRESH_COOKIE_PATH,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}
