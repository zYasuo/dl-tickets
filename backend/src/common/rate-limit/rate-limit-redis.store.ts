import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { getRedisConnectionOptions } from '../redis/redis-connection.options';

const KEY_PREFIX = 'ratelimit:';

@Injectable()
export class RateLimitRedisStore implements OnModuleDestroy {
  private readonly redis = new Redis(getRedisConnectionOptions());

  async increment(key: string, windowSeconds: number): Promise<{ count: number }> {
    const ns = KEY_PREFIX + key;
    const count = await this.redis.incr(ns);
    if (count === 1) {
      await this.redis.expire(ns, windowSeconds);
    }
    return { count };
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
