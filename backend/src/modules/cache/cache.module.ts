import { Module } from '@nestjs/common';
import { CACHE_PORT } from 'src/di/tokens';
import { CacheService } from './services/cache.service';

@Module({
  providers: [
    CacheService,
    {
      provide: CACHE_PORT,
      useExisting: CacheService,
    },
  ],
  exports: [CacheService, CACHE_PORT],
})
export class CacheModule {}
