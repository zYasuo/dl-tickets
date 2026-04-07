import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { parseProcessEnv } from './config/env.schema';
import { NestExpressApplication } from '@nestjs/platform-express';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './modules/app.module';
import { getTrustProxySetting } from './common/http/trust-proxy';
import { TransformResponseInterceptor } from './common/http/transform-response.interceptor';
import { HttpExceptionFilter } from './common/http/http-exception.filter';
import { getRedisConnectionOptions } from './common/redis/redis-connection.options';
import { isOpenApiDocsEnabled } from './common/openapi/openapi-docs-enabled';
import { setupOpenApiDocs } from './common/openapi/setup-openapi-docs';

async function bootstrap() {
  parseProcessEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const trust = getTrustProxySetting();
  if (trust !== false) {
    app.set('trust proxy', trust);
  }

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: getRedisConnectionOptions(),
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  if (isOpenApiDocsEnabled()) {
    setupOpenApiDocs(app, {
      title: 'DL System API',
      description:
        'DL System HTTP API: JWT access tokens and httpOnly refresh cookies. Responses use `{ success, timestamp, data }` (or error envelope). **Tickets**, **clients**, and **client contracts** require `Authorization: Bearer <accessToken>`. Register at `POST /users`, then `POST /auth/login`.',
      version: '0.0.1',
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
