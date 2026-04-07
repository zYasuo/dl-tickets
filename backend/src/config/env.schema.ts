import { z } from 'zod';


export const processEnvSchema = z
  .object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    NODE_ENV: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    PORT: z.string().optional(),
    REDIS_HOST: z.string().optional(),
    REDIS_PORT: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_USERNAME: z.string().optional(),
    REDIS_DATABASE: z.string().optional(),
    JWT_ACCESS_EXPIRATION_SECONDS: z.string().optional(),
    JWT_REFRESH_EXPIRATION_DAYS: z.string().optional(),
    TRUST_PROXY: z.string().optional(),
    ENABLE_OPENAPI_DOCS: z.string().optional(),
    ENABLE_SWAGGER: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (data.JWT_SECRET.length < 32) {
        ctx.addIssue({
          code: 'custom',
          message: 'JWT_SECRET must be at least 32 characters in production',
          path: ['JWT_SECRET'],
        });
      }
      const resend = data.RESEND_API_KEY?.trim() ?? '';
      if (!resend) {
        ctx.addIssue({
          code: 'custom',
          message: 'RESEND_API_KEY is required in production',
          path: ['RESEND_API_KEY'],
        });
      }
    }
  });

export type ParsedProcessEnv = z.infer<typeof processEnvSchema>;

export function parseProcessEnv(): ParsedProcessEnv {
  const result = processEnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(JSON.stringify(z.treeifyError(result.error), null, 2));
    throw result.error;
  }
  return result.data;
}
