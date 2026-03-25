import { Global, Module } from '@nestjs/common';
import { RateLimitRedisStore } from './rate-limit-redis.store';

@Global()
@Module({
  providers: [RateLimitRedisStore],
  exports: [RateLimitRedisStore],
})
export class RateLimitModule {}
