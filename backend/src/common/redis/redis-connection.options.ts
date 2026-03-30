import type { RedisOptions } from 'ioredis';

export function getRedisConnectionOptions(): RedisOptions {
  const port = parseInt(process.env.REDIS_PORT ?? '6379', 10);
  const db = process.env.REDIS_DATABASE ? parseInt(process.env.REDIS_DATABASE, 10) : undefined;

  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port,
    maxRetriesPerRequest: null,
    ...(process.env.REDIS_PASSWORD && {
      password: process.env.REDIS_PASSWORD,
    }),
    ...(process.env.REDIS_USERNAME && {
      username: process.env.REDIS_USERNAME,
    }),
    ...(db !== undefined && !Number.isNaN(db) && { db }),
  };
}
