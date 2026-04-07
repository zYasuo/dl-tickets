import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';

export function requestNest(app: INestApplication) {
  return request(app.getHttpServer() as Server);
}
