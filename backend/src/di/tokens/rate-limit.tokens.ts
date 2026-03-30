import type { InjectionToken } from '@nestjs/common';

export type RateLimitStore = {
  increment(key: string, windowSeconds: number): Promise<{ count: number }>;
};

export const RATE_LIMIT_STORE: InjectionToken<RateLimitStore> =
  Symbol('RATE_LIMIT_STORE');
