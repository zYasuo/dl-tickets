import type { IncomingHttpHeaders } from 'node:http';
import type { FastifyReply } from 'fastify';

export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export function normalizeCookieHeader(cookie: IncomingHttpHeaders['cookie']): string | undefined {
  if (cookie === undefined) return undefined;
  if (typeof cookie === 'string') return cookie;
  if (Array.isArray(cookie)) {
    const first = cookie[0];
    return typeof first === 'string' ? first : undefined;
  }
  return undefined;
}
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

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: REFRESH_COOKIE_PATH,
};

export function setRefreshTokenCookie(res: FastifyReply, token: string, maxAgeMs: number): void {
  res.setCookie(REFRESH_TOKEN_COOKIE, token, {
    ...cookieBase,
    maxAge: maxAgeMs,
  });
}

export function clearRefreshTokenCookie(res: FastifyReply): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, cookieBase);
}
