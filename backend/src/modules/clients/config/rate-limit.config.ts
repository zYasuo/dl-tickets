import {
  rateLimitEntryFromEnv,
  type RateLimitEntry,
} from '../../../common/rate-limit/rate-limit-env';

export type ClientsRateLimitKey =
  | 'clients-create'
  | 'clients-list'
  | 'clients-search'
  | 'clients-get-by-id';

const defaults: Record<ClientsRateLimitKey, RateLimitEntry> = {
  'clients-create': { max: 30, windowSeconds: 60 },
  'clients-list': { max: 120, windowSeconds: 60 },
  'clients-search': { max: 60, windowSeconds: 60 },
  'clients-get-by-id': { max: 120, windowSeconds: 60 },
};

export function buildClientsRateLimitConfig(): Record<ClientsRateLimitKey, RateLimitEntry> {
  return {
    'clients-create': rateLimitEntryFromEnv(
      'RATE_LIMIT_CLIENTS_CREATE',
      defaults['clients-create'],
    ),
    'clients-list': rateLimitEntryFromEnv('RATE_LIMIT_CLIENTS_LIST', defaults['clients-list']),
    'clients-search': rateLimitEntryFromEnv(
      'RATE_LIMIT_CLIENTS_SEARCH',
      defaults['clients-search'],
    ),
    'clients-get-by-id': rateLimitEntryFromEnv(
      'RATE_LIMIT_CLIENTS_GET_BY_ID',
      defaults['clients-get-by-id'],
    ),
  };
}
