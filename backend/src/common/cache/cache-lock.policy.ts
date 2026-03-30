export const CACHE_LOCK_POLICY = {
  ttlSeconds: 5,
  waitMaxMs: 1500,
  waitStepMs: 50,
} as const;

export function buildCacheLockKey(cacheKey: string): string {
  return `lock:${cacheKey}`;
}
