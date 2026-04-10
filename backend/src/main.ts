import 'dotenv/config';
import fastifyCookie from '@fastify/cookie';
import { NestFactory } from '@nestjs/core';
import { parseProcessEnv } from './config/env.schema';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
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
  const trust = getTrustProxySetting();
  const fastifyAdapter = new FastifyAdapter({
    ...(trust !== false ? { trustProxy: true } : {}),
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter);

  await app.register(fastifyCookie);

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

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
