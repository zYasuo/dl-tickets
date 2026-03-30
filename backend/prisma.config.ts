import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { resolve } from 'path';
import { defineConfig, env } from 'prisma/config';

expand(config({ path: resolve(__dirname, '.env') }));

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
