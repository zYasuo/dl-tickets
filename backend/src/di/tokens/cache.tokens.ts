import type { InjectionToken } from '@nestjs/common';
import type { CachePort } from 'src/common/ports/cache/cache.ports';

export const CACHE_PORT: InjectionToken<CachePort> = Symbol('CACHE_PORT');
