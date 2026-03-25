import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './modules/app.module';
import { TransformResponseInterceptor } from './common/http/transform-response.interceptor';
import { HttpExceptionFilter } from './common/http/http-exception.filter';
import { getRedisConnectionOptions } from './common/redis/redis-connection.options';
import { isOpenApiDocsEnabled } from './common/openapi/openapi-docs-enabled';
import { setupOpenApiDocs } from './common/openapi/setup-openapi-docs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: getRedisConnectionOptions(),
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  if (isOpenApiDocsEnabled()) {
    setupOpenApiDocs(app, {
      title: 'DL Tickets API',
      description: 'HTTP API for tickets and users (`success` + `data` response envelope).',
      version: '0.0.1',
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
