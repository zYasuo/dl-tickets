import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { COMMON_API_ERROR_CODES } from 'src/common/errors/application';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import type { TokenProviderPort } from 'src/modules/auth/domain/ports/security/token-provider.port';
import { TOKEN_PROVIDER } from '../../../../di.tokens';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKEN_PROVIDER) private readonly tokenProvider: TokenProviderPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        message: 'Unauthorized',
        code: COMMON_API_ERROR_CODES.UNAUTHORIZED,
      });
    }

    try {
      const payload = await this.tokenProvider.verifyAccessToken(token);
      (request as FastifyRequest & { user: AuthUser }).user = {
        sub: payload.sub,
        email: payload.email,
      };
    } catch {
      throw new UnauthorizedException({
        message: 'Unauthorized',
        code: COMMON_API_ERROR_CODES.UNAUTHORIZED,
      });
    }

    return true;
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
