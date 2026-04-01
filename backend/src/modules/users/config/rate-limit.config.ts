import {
  rateLimitEntryFromEnv,
  type RateLimitEntry,
} from '../../../common/rate-limit/rate-limit-env';

export type UsersRateLimitKey = 'users-register';

const defaults: Record<UsersRateLimitKey, RateLimitEntry> = {
  'users-register': { max: 10, windowSeconds: 3600 },
};

export function buildUsersRateLimitConfig(): Record<UsersRateLimitKey, RateLimitEntry> {
  return {
    'users-register': rateLimitEntryFromEnv(
      'RATE_LIMIT_USERS_REGISTER',
      defaults['users-register'],
    ),
  };
}
