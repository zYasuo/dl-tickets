import fastifyCookie from '@fastify/cookie';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { TestingModule } from '@nestjs/testing';

/**
 * Nest + Fastify for integration/e2e-style tests: registers @fastify/cookie, optional setup, then init + ready().
 */
export async function createNestFastifyTestingApp(
  moduleFixture: TestingModule,
  setup?: (app: NestFastifyApplication) => void | Promise<void>,
): Promise<NestFastifyApplication> {
  const app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.register(fastifyCookie);
  if (setup) {
    await setup(app);
  }
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
