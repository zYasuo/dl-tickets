import { registerAs } from '@nestjs/config';
import type { RateLimitEntry } from '../common/rate-limit/rate-limit-env';
import {
  buildAuthRateLimitConfig,
  type AuthRateLimitKey,
} from '../modules/auth/config/rate-limit.config';
import {
  buildClientContractsRateLimitConfig,
  type ClientContractsRateLimitKey,
} from '../modules/client-contracts/config/rate-limit.config';
import {
  buildClientsRateLimitConfig,
  type ClientsRateLimitKey,
} from '../modules/clients/config/rate-limit.config';
import {
  buildTicketsRateLimitConfig,
  type TicketsRateLimitKey,
} from '../modules/tickets/config/rate-limit.config';
import {
  buildUsersRateLimitConfig,
  type UsersRateLimitKey,
} from '../modules/users/config/rate-limit.config';

export type { RateLimitEntry };

export type RateLimitEndpointKey =
  | UsersRateLimitKey
  | TicketsRateLimitKey
  | ClientsRateLimitKey
  | ClientContractsRateLimitKey
  | AuthRateLimitKey;

export type RateLimitConfig = Record<RateLimitEndpointKey, RateLimitEntry>;

export const rateLimitConfig = registerAs(
  'rateLimit',
  (): RateLimitConfig => ({
    ...buildUsersRateLimitConfig(),
    ...buildTicketsRateLimitConfig(),
    ...buildClientsRateLimitConfig(),
    ...buildClientContractsRateLimitConfig(),
    ...buildAuthRateLimitConfig(),
  }),
);
