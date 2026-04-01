import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';

/**
 * Nest's getHttpServer() is typed as any; supertest expects App (e.g. http.Server).
 * Single cast keeps controller specs clean under @typescript-eslint/no-unsafe-argument.
 */
export function requestNest(app: INestApplication) {
  return request(app.getHttpServer() as Server);
}
