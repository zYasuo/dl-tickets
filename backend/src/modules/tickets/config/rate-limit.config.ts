import {
  rateLimitEntryFromEnv,
  type RateLimitEntry,
} from '../../../common/rate-limit/rate-limit-env';

export type TicketsRateLimitKey =
  | 'tickets-list'
  | 'tickets-get-by-id'
  | 'tickets-create'
  | 'tickets-update';

const defaults: Record<TicketsRateLimitKey, RateLimitEntry> = {
  'tickets-list': { max: 120, windowSeconds: 60 },
  'tickets-get-by-id': { max: 120, windowSeconds: 60 },
  'tickets-create': { max: 30, windowSeconds: 60 },
  'tickets-update': { max: 60, windowSeconds: 60 },
};

export function buildTicketsRateLimitConfig(): Record<TicketsRateLimitKey, RateLimitEntry> {
  return {
    'tickets-list': rateLimitEntryFromEnv('RATE_LIMIT_TICKETS_LIST', defaults['tickets-list']),
    'tickets-get-by-id': rateLimitEntryFromEnv(
      'RATE_LIMIT_TICKETS_GET_BY_ID',
      defaults['tickets-get-by-id'],
    ),
    'tickets-create': rateLimitEntryFromEnv(
      'RATE_LIMIT_TICKETS_CREATE',
      defaults['tickets-create'],
    ),
    'tickets-update': rateLimitEntryFromEnv(
      'RATE_LIMIT_TICKETS_UPDATE',
      defaults['tickets-update'],
    ),
  };
}
