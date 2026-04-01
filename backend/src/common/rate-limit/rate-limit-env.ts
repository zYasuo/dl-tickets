export interface RateLimitEntry {
  max: number;
  windowSeconds: number;
}

export function parseIntEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;

  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

export function rateLimitEntryFromEnv(envPrefix: string, defaults: RateLimitEntry): RateLimitEntry {
  return {
    max: parseIntEnv(`${envPrefix}_MAX`, defaults.max),
    windowSeconds: parseIntEnv(`${envPrefix}_WINDOW_SECONDS`, defaults.windowSeconds),
  };
}
