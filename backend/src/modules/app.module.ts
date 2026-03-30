import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';
import { RateLimitModule } from '../common/rate-limit/rate-limit.module';
import { rateLimitConfig } from '../config/rate-limit.config';
import { authConfig } from '../config/auth.config';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/ticket.module';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue';
import { CacheModule } from './cache/cache.module';
import { JwtAuthGuard } from './auth/infrastructure/inbound/http/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [rateLimitConfig, authConfig],
    }),
    RateLimitModule,
    QueueModule,
    CacheModule,
    UsersModule,
    AuthModule,
    TicketsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
