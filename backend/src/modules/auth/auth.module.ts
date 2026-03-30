import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { IAuthConfig } from 'src/config/auth.config';
import {
  PASSWORD_RESET_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_PROVIDER,
} from 'src/di/tokens';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notifications/notification.module';
import { AuthController } from './infrastructure/inbound/http/controllers/auth.controller';
import { JwtAuthGuard } from './infrastructure/inbound/http/guards/jwt-auth.guard';
import { JwtTokenProvider } from './infrastructure/outbound/security/jwt-token-provider';
import { RefreshTokenRepository } from './infrastructure/outbound/persistence/repositories/refresh-token.repository';
import { PasswordResetRepository } from './infrastructure/outbound/persistence/repositories/password-reset.repository';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const auth = config.get<IAuthConfig>('auth');
        if (!auth?.jwtSecret?.trim()) {
          throw new Error('JWT_SECRET is required');
        }
        return {
          secret: auth.jwtSecret,
          signOptions: {
            expiresIn: auth.accessExpirationSeconds,
          },
        };
      },
    }),
    UsersModule,
    NotificationModule,
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    JwtAuthGuard,
    {
      provide: TOKEN_PROVIDER,
      useClass: JwtTokenProvider,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenRepository,
    },
    {
      provide: PASSWORD_RESET_REPOSITORY,
      useClass: PasswordResetRepository,
    },
  ],
  exports: [JwtAuthGuard, TOKEN_PROVIDER],
})
export class AuthModule {}
