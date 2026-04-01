import {
  rateLimitEntryFromEnv,
  type RateLimitEntry,
} from '../../../common/rate-limit/rate-limit-env';

export type LocationsRateLimitKey =
  | 'locations-countries-list'
  | 'locations-countries-get'
  | 'locations-countries-create'
  | 'locations-countries-update'
  | 'locations-countries-delete'
  | 'locations-states-list'
  | 'locations-states-get'
  | 'locations-states-create'
  | 'locations-states-update'
  | 'locations-states-delete'
  | 'locations-cities-list'
  | 'locations-cities-get'
  | 'locations-cities-create'
  | 'locations-cities-update'
  | 'locations-cities-delete';

const defaults: Record<LocationsRateLimitKey, RateLimitEntry> = {
  'locations-countries-list': { max: 120, windowSeconds: 60 },
  'locations-countries-get': { max: 120, windowSeconds: 60 },
  'locations-countries-create': { max: 30, windowSeconds: 60 },
  'locations-countries-update': { max: 30, windowSeconds: 60 },
  'locations-countries-delete': { max: 20, windowSeconds: 60 },
  'locations-states-list': { max: 120, windowSeconds: 60 },
  'locations-states-get': { max: 120, windowSeconds: 60 },
  'locations-states-create': { max: 30, windowSeconds: 60 },
  'locations-states-update': { max: 30, windowSeconds: 60 },
  'locations-states-delete': { max: 20, windowSeconds: 60 },
  'locations-cities-list': { max: 120, windowSeconds: 60 },
  'locations-cities-get': { max: 120, windowSeconds: 60 },
  'locations-cities-create': { max: 30, windowSeconds: 60 },
  'locations-cities-update': { max: 30, windowSeconds: 60 },
  'locations-cities-delete': { max: 20, windowSeconds: 60 },
};

export function buildLocationsRateLimitConfig(): Record<LocationsRateLimitKey, RateLimitEntry> {
  const out = {} as Record<LocationsRateLimitKey, RateLimitEntry>;
  (Object.keys(defaults) as LocationsRateLimitKey[]).forEach((key) => {
    const envKey = `RATE_LIMIT_${key.replace(/-/gu, '_').toUpperCase()}`;
    out[key] = rateLimitEntryFromEnv(envKey, defaults[key]);
  });
  return out;
}
