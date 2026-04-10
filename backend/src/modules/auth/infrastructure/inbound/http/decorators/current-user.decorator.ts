import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

export type AuthUser = {
  sub: string;
  email: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return (request as FastifyRequest & { user: AuthUser }).user;
  },
);
