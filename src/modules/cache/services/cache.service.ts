import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { getRedisConnectionOptions } from '../../../common/redis/redis-connection.options';
import { CachePort } from 'src/common/ports/cache/cache.ports';

const KEY_PREFIX = 'cache:';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy, CachePort {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(getRedisConnectionOptions());
  }

  onModuleInit(): void {
    this.redis.on('ready', () => {
      this.logger.log('Redis (cache) ready');
    });
    this.redis.on('error', (err) => {
      this.logger.error(err.message, err.stack);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  private ns(key: string): string {
    return `${KEY_PREFIX}${key}`;
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(this.ns(key));
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(this.ns(key), value, 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(this.ns(key));
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(this.ns(key))) === 1;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      this.logger.warn(`Invalid JSON in cache for key: ${key}`);
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(this.ns(key));
  }

  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.set(this.ns(key), '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.redis.del(this.ns(key));
  }
}
