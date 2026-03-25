import { registerAs } from '@nestjs/config';

export type TRateLimitEndpointKey =
  | 'users-register'
  | 'tickets-list'
  | 'tickets-create'
  | 'tickets-update';

export interface IRateLimitEntry {
  max: number;
  windowSeconds: number;
}

export type IRateLimitConfig = Record<TRateLimitEndpointKey, IRateLimitEntry>;

function parseIntEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;

  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

const defaults: IRateLimitConfig = {
  'users-register': { max: 10, windowSeconds: 3600 },
  'tickets-list': { max: 120, windowSeconds: 60 },
  'tickets-create': { max: 30, windowSeconds: 60 },
  'tickets-update': { max: 60, windowSeconds: 60 },
};

export const rateLimitConfig = registerAs(
  'rateLimit',
  (): IRateLimitConfig => ({
    'users-register': {
      max: parseIntEnv('RATE_LIMIT_USERS_REGISTER_MAX', defaults['users-register'].max),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_USERS_REGISTER_WINDOW_SECONDS',
        defaults['users-register'].windowSeconds,
      ),
    },
    'tickets-list': {
      max: parseIntEnv('RATE_LIMIT_TICKETS_LIST_MAX', defaults['tickets-list'].max),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_TICKETS_LIST_WINDOW_SECONDS',
        defaults['tickets-list'].windowSeconds,
      ),
    },
    'tickets-create': {
      max: parseIntEnv('RATE_LIMIT_TICKETS_CREATE_MAX', defaults['tickets-create'].max),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_TICKETS_CREATE_WINDOW_SECONDS',
        defaults['tickets-create'].windowSeconds,
      ),
    },
    'tickets-update': {
      max: parseIntEnv('RATE_LIMIT_TICKETS_UPDATE_MAX', defaults['tickets-update'].max),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_TICKETS_UPDATE_WINDOW_SECONDS',
        defaults['tickets-update'].windowSeconds,
      ),
    },
  }),
);
