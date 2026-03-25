import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';
import { RateLimitModule } from '../common/rate-limit/rate-limit.module';
import { rateLimitConfig } from '../config/rate-limit.config';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/ticket.module';
import { QueueModule } from './queue/queue';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [rateLimitConfig] }),
    RateLimitModule,
    QueueModule,
    CacheModule,
    UsersModule,
    TicketsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
