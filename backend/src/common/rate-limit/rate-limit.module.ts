import { Global, Module } from '@nestjs/common';
import { RATE_LIMIT_STORE } from 'src/di/tokens';
import { RateLimitRedisStore } from './rate-limit-redis.store';

@Global()
@Module({
  providers: [
    RateLimitRedisStore,
    {
      provide: RATE_LIMIT_STORE,
      useExisting: RateLimitRedisStore,
    },
  ],
  exports: [RateLimitRedisStore, RATE_LIMIT_STORE],
})
export class RateLimitModule {}
