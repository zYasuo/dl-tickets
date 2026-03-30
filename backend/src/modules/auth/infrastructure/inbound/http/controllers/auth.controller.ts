import { Body, Controller, HttpCode, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { RateLimitEndpoint } from 'src/common/rate-limit/rate-limit-endpoint.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { Public } from '../decorators/public.decorator';
import { LoginUseCase } from 'src/modules/auth/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from 'src/modules/auth/application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from 'src/modules/auth/application/use-cases/logout.use-case';
import { RequestPasswordResetUseCase } from 'src/modules/auth/application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from 'src/modules/auth/application/use-cases/reset-password.use-case';
import { SLogin, type TLogin } from 'src/modules/auth/application/dto/login.dto';
import {
  SRequestPasswordReset,
  type TRequestPasswordReset,
} from 'src/modules/auth/application/dto/request-password-reset.dto';
import {
  SResetPassword,
  type TResetPassword,
} from 'src/modules/auth/application/dto/reset-password.dto';
import { ApiAuth, AuthDoc } from '../docs/auth-doc.decorator';
import type { IAuthConfig } from 'src/config/auth.config';
import {
  clearRefreshTokenCookie,
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
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @RateLimitEndpoint('auth-login')
  @AuthDoc.Login()
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(SLogin)) dto: TLogin,
    @Res({ passthrough: true }) res: Response,
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
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const raw = readRefreshTokenFromRequest(req.headers.cookie);
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
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const raw = readRefreshTokenFromRequest(req.headers.cookie);
    await this.logoutUseCase.execute(raw ?? '');
    clearRefreshTokenCookie(res);
    return { message: 'Signed out' };
  }

  @Public()
  @RateLimitEndpoint('auth-password-reset-request')
  @AuthDoc.PasswordResetRequest()
  @HttpCode(200)
  async requestPasswordReset(
    @Body(new ZodValidationPipe(SRequestPasswordReset)) dto: TRequestPasswordReset,
  ): Promise<{ message: string }> {
    const message = await this.requestPasswordResetUseCase.execute(dto);
    return { message };
  }

  @Public()
  @RateLimitEndpoint('auth-password-reset-confirm')
  @AuthDoc.PasswordResetConfirm()
  @HttpCode(200)
  async confirmPasswordReset(
    @Body(new ZodValidationPipe(SResetPassword)) dto: TResetPassword,
  ): Promise<{ message: string }> {
    await this.resetPasswordUseCase.execute(dto);
    return { message: 'Password has been updated' };
  }
}
