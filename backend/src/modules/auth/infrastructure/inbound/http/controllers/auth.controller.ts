import { Body, Controller, HttpCode, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { RateLimitEndpoint } from 'src/common/rate-limit/rate-limit-endpoint.decorator';
import { Public } from '../decorators/public.decorator';
import { LoginUseCase } from 'src/modules/auth/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from 'src/modules/auth/application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from 'src/modules/auth/application/use-cases/logout.use-case';
import { RequestPasswordResetUseCase } from 'src/modules/auth/application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from 'src/modules/auth/application/use-cases/reset-password.use-case';
import { VerifyEmailOtpUseCase } from 'src/modules/auth/application/use-cases/verify-email-otp.use-case';
import { ResendEmailVerificationUseCase } from 'src/modules/auth/application/use-cases/resend-email-verification.use-case';
import { LoginBodyDto } from 'src/modules/auth/application/dto/login.dto';
import { RequestPasswordResetBodyDto } from 'src/modules/auth/application/dto/request-password-reset.dto';
import { ResetPasswordBodyDto } from 'src/modules/auth/application/dto/reset-password.dto';
import { VerifyEmailBodyDto } from 'src/modules/auth/application/dto/verify-email.dto';
import { ResendEmailVerificationBodyDto } from 'src/modules/auth/application/dto/resend-email-verification.dto';
import { ApiAuth, AuthDoc } from '../docs/auth-doc.decorator';
import type { IAuthConfig } from 'src/modules/auth/config/auth.config';
import {
  clearRefreshTokenCookie,
  normalizeCookieHeader,
  readRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from '../utils/refresh-cookie';

@Controller('auth')
@ApiAuth()
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly verifyEmailOtpUseCase: VerifyEmailOtpUseCase,
    private readonly resendEmailVerificationUseCase: ResendEmailVerificationUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @RateLimitEndpoint('auth-login')
  @AuthDoc.Login()
  @HttpCode(200)
  async login(
    @Body() dto: LoginBodyDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<{ accessToken: string }> {
    const result = await this.loginUseCase.execute(dto);
    const auth = this.configService.get<IAuthConfig>('auth')!;
    const maxAgeMs = auth.refreshExpirationDays * 24 * 60 * 60 * 1000;
    setRefreshTokenCookie(res, result.refreshToken, maxAgeMs);
    return { accessToken: result.accessToken };
  }

  @Public()
  @RateLimitEndpoint('auth-refresh')
  @AuthDoc.Refresh()
  @HttpCode(200)
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<{ accessToken: string }> {
    const raw = readRefreshTokenFromRequest(normalizeCookieHeader(req.headers.cookie));
    const result = await this.refreshTokenUseCase.execute(raw ?? '');
    const auth = this.configService.get<IAuthConfig>('auth')!;
    const maxAgeMs = auth.refreshExpirationDays * 24 * 60 * 60 * 1000;
    setRefreshTokenCookie(res, result.refreshToken, maxAgeMs);
    return { accessToken: result.accessToken };
  }

  @Public()
  @RateLimitEndpoint('auth-logout')
  @AuthDoc.Logout()
  @HttpCode(200)
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<{ message: string }> {
    const raw = readRefreshTokenFromRequest(normalizeCookieHeader(req.headers.cookie));
    await this.logoutUseCase.execute(raw ?? '');
    clearRefreshTokenCookie(res);
    return { message: 'Signed out' };
  }

  @Public()
  @RateLimitEndpoint('auth-password-reset-request')
  @AuthDoc.PasswordResetRequest()
  @HttpCode(200)
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetBodyDto,
  ): Promise<{ message: string }> {
    const message = await this.requestPasswordResetUseCase.execute(dto);
    return { message };
  }

  @Public()
  @RateLimitEndpoint('auth-password-reset-confirm')
  @AuthDoc.PasswordResetConfirm()
  @HttpCode(200)
  async confirmPasswordReset(@Body() dto: ResetPasswordBodyDto): Promise<{ message: string }> {
    await this.resetPasswordUseCase.execute(dto);
    return { message: 'Password has been updated' };
  }

  @Public()
  @RateLimitEndpoint('auth-email-verify')
  @AuthDoc.EmailVerify()
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyEmailBodyDto): Promise<{ message: string }> {
    await this.verifyEmailOtpUseCase.execute(dto);
    return { message: 'Email verified successfully' };
  }

  @Public()
  @RateLimitEndpoint('auth-email-resend')
  @AuthDoc.EmailResend()
  @HttpCode(200)
  async resendEmailVerification(
    @Body() dto: ResendEmailVerificationBodyDto,
  ): Promise<{ message: string }> {
    const message = await this.resendEmailVerificationUseCase.execute(dto);
    return { message };
  }
}
