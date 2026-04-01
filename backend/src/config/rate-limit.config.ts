import { registerAs } from '@nestjs/config';

export type TRateLimitEndpointKey =
  | 'users-register'
  | 'tickets-list'
  | 'tickets-get-by-id'
  | 'tickets-create'
  | 'tickets-update'
  | 'clients-create'
  | 'clients-list'
  | 'clients-get-by-id'
  | 'client-contracts-create'
  | 'client-contracts-list'
  | 'client-contracts-get-by-id'
  | 'client-contracts-update'
  | 'auth-login'
  | 'auth-refresh'
  | 'auth-logout'
  | 'auth-password-reset-request'
  | 'auth-password-reset-confirm';

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
  'tickets-get-by-id': { max: 120, windowSeconds: 60 },
  'tickets-create': { max: 30, windowSeconds: 60 },
  'tickets-update': { max: 60, windowSeconds: 60 },
  'clients-create': { max: 30, windowSeconds: 60 },
  'clients-list': { max: 120, windowSeconds: 60 },
  'clients-get-by-id': { max: 120, windowSeconds: 60 },
  'client-contracts-create': { max: 30, windowSeconds: 60 },
  'client-contracts-list': { max: 120, windowSeconds: 60 },
  'client-contracts-get-by-id': { max: 120, windowSeconds: 60 },
  'client-contracts-update': { max: 60, windowSeconds: 60 },
  'auth-login': { max: 5, windowSeconds: 900 },
  'auth-refresh': { max: 30, windowSeconds: 60 },
  'auth-logout': { max: 60, windowSeconds: 60 },
  'auth-password-reset-request': { max: 3, windowSeconds: 3600 },
  'auth-password-reset-confirm': { max: 5, windowSeconds: 3600 },
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
    'tickets-get-by-id': {
      max: parseIntEnv('RATE_LIMIT_TICKETS_GET_BY_ID_MAX', defaults['tickets-get-by-id'].max),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_TICKETS_GET_BY_ID_WINDOW_SECONDS',
        defaults['tickets-get-by-id'].windowSeconds,
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
    'clients-create': {
      max: parseIntEnv('RATE_LIMIT_CLIENTS_CREATE_MAX', defaults['clients-create'].max),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_CLIENTS_CREATE_WINDOW_SECONDS',
        defaults['clients-create'].windowSeconds,
      ),
    },
    'clients-list': {
      max: parseIntEnv('RATE_LIMIT_CLIENTS_LIST_MAX', defaults['clients-list'].max),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_CLIENTS_LIST_WINDOW_SECONDS',
        defaults['clients-list'].windowSeconds,
      ),
    },
    'clients-get-by-id': {
      max: parseIntEnv('RATE_LIMIT_CLIENTS_GET_BY_ID_MAX', defaults['clients-get-by-id'].max),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_CLIENTS_GET_BY_ID_WINDOW_SECONDS',
        defaults['clients-get-by-id'].windowSeconds,
      ),
    },
    'client-contracts-create': {
      max: parseIntEnv(
        'RATE_LIMIT_CLIENT_CONTRACTS_CREATE_MAX',
        defaults['client-contracts-create'].max,
      ),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_CLIENT_CONTRACTS_CREATE_WINDOW_SECONDS',
        defaults['client-contracts-create'].windowSeconds,
      ),
    },
    'client-contracts-list': {
      max: parseIntEnv(
        'RATE_LIMIT_CLIENT_CONTRACTS_LIST_MAX',
        defaults['client-contracts-list'].max,
      ),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_CLIENT_CONTRACTS_LIST_WINDOW_SECONDS',
        defaults['client-contracts-list'].windowSeconds,
      ),
    },
    'client-contracts-get-by-id': {
      max: parseIntEnv(
        'RATE_LIMIT_CLIENT_CONTRACTS_GET_BY_ID_MAX',
        defaults['client-contracts-get-by-id'].max,
      ),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_CLIENT_CONTRACTS_GET_BY_ID_WINDOW_SECONDS',
        defaults['client-contracts-get-by-id'].windowSeconds,
      ),
    },
    'client-contracts-update': {
      max: parseIntEnv(
        'RATE_LIMIT_CLIENT_CONTRACTS_UPDATE_MAX',
        defaults['client-contracts-update'].max,
      ),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_CLIENT_CONTRACTS_UPDATE_WINDOW_SECONDS',
        defaults['client-contracts-update'].windowSeconds,
      ),
    },
    'auth-login': {
      max: parseIntEnv('RATE_LIMIT_AUTH_LOGIN_MAX', defaults['auth-login'].max),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_AUTH_LOGIN_WINDOW_SECONDS',
        defaults['auth-login'].windowSeconds,
      ),
    },
    'auth-refresh': {
      max: parseIntEnv('RATE_LIMIT_AUTH_REFRESH_MAX', defaults['auth-refresh'].max),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_AUTH_REFRESH_WINDOW_SECONDS',
        defaults['auth-refresh'].windowSeconds,
      ),
    },
    'auth-logout': {
      max: parseIntEnv('RATE_LIMIT_AUTH_LOGOUT_MAX', defaults['auth-logout'].max),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_AUTH_LOGOUT_WINDOW_SECONDS',
        defaults['auth-logout'].windowSeconds,
      ),
    },
    'auth-password-reset-request': {
      max: parseIntEnv(
        'RATE_LIMIT_AUTH_PASSWORD_RESET_REQUEST_MAX',
        defaults['auth-password-reset-request'].max,
      ),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_AUTH_PASSWORD_RESET_REQUEST_WINDOW_SECONDS',
        defaults['auth-password-reset-request'].windowSeconds,
      ),
    },
    'auth-password-reset-confirm': {
      max: parseIntEnv(
        'RATE_LIMIT_AUTH_PASSWORD_RESET_CONFIRM_MAX',
        defaults['auth-password-reset-confirm'].max,
      ),
      windowSeconds: parseIntEnv(
        'RATE_LIMIT_AUTH_PASSWORD_RESET_CONFIRM_WINDOW_SECONDS',
        defaults['auth-password-reset-confirm'].windowSeconds,
      ),
    },
  }),
);
