import { applyDecorators, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { standardError } from 'src/common/openapi/standard-error-doc.helper';
import { LoginBodyDto } from 'src/modules/auth/application/dto/login.dto';
import { RequestPasswordResetBodyDto } from 'src/modules/auth/application/dto/request-password-reset.dto';
import { ResetPasswordBodyDto } from 'src/modules/auth/application/dto/reset-password.dto';
import {
  LoginEnvelopeOpenApiDto,
  MessageEnvelopeOpenApiDto,
} from '../schemas/auth-public-http.openapi.dto';

export function ApiAuth() {
  return ApiTags('Auth');
}

export class AuthDoc {
  static Login() {
    return applyDecorators(
      Post('login'),
      ApiOperation({ summary: 'Sign in (access token + httpOnly refresh cookie)' }),
      ApiBody({ type: LoginBodyDto }),
      ApiResponse({
        status: 200,
        description:
          'Sets httpOnly refresh cookie on path /api/v1/auth. Response wraps `{ success, timestamp, data: { accessToken } }`.',
        type: LoginEnvelopeOpenApiDto,
      }),
      standardError(400, 'Validation'),
      standardError(401, 'Invalid email or password'),
      standardError(429, 'Rate limit'),
    );
  }

  static Refresh() {
    return applyDecorators(
      Post('refresh'),
      ApiOperation({ summary: 'Rotate refresh token (cookie)' }),
      ApiResponse({
        status: 200,
        description: 'New access token and rotated refresh cookie.',
        type: LoginEnvelopeOpenApiDto,
      }),
      standardError(401, 'Invalid or expired refresh'),
      standardError(429, 'Rate limit'),
    );
  }

  static Logout() {
    return applyDecorators(
      Post('logout'),
      ApiOperation({ summary: 'Revoke refresh session (cookie)' }),
      ApiResponse({
        status: 200,
        description: 'Cookie cleared.',
        type: MessageEnvelopeOpenApiDto,
      }),
      standardError(429, 'Rate limit'),
    );
  }

  static PasswordResetRequest() {
    return applyDecorators(
      Post('password-reset/request'),
      ApiOperation({ summary: 'Request password reset email' }),
      ApiBody({ type: RequestPasswordResetBodyDto }),
      ApiResponse({
        status: 200,
        description: 'Same message whether or not the email exists.',
        type: MessageEnvelopeOpenApiDto,
      }),
      standardError(400, 'Validation'),
      standardError(429, 'Rate limit'),
    );
  }

  static PasswordResetConfirm() {
    return applyDecorators(
      Post('password-reset/confirm'),
      ApiOperation({ summary: 'Confirm password reset with token' }),
      ApiBody({ type: ResetPasswordBodyDto }),
      ApiResponse({
        status: 200,
        description: 'Password updated; all refresh sessions revoked.',
        type: MessageEnvelopeOpenApiDto,
      }),
      standardError(400, 'Invalid or expired token'),
      standardError(429, 'Rate limit'),
    );
  }
}
