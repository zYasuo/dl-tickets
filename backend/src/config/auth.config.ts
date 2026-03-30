import { registerAs } from '@nestjs/config';

export interface IAuthConfig {
  jwtSecret: string;
  accessExpirationSeconds: number;
  refreshExpirationDays: number;
}

export const authConfig = registerAs(
  'auth',
  (): IAuthConfig => ({
    jwtSecret: process.env.JWT_SECRET ?? '',
    accessExpirationSeconds: parseInt(process.env.JWT_ACCESS_EXPIRATION_SECONDS ?? '900', 10),
    refreshExpirationDays: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS ?? '7', 10),
  }),
);
