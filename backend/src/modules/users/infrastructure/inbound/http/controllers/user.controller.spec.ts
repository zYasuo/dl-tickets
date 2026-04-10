import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_PIPE } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { ApplicationException } from 'src/common/errors/application';
import { HttpExceptionFilter } from 'src/common/http/http-exception.filter';
import { AppZodValidationPipe } from 'src/common/pipes/app-zod-validation.pipe';
import { createNestFastifyTestingApp } from 'src/test-support/create-nest-fastify-testing-app';
import { requestNest } from 'src/test-support/supertest-nest-app';
import { USER_API_ERROR_CODES } from 'src/modules/users/application/errors';
import { CreateUserUseCase } from 'src/modules/users/application/use-cases/create-user.use-case';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import { UserController } from './user.controller';

describe('UserController (integration)', () => {
  let app: NestFastifyApplication;
  let createUser: jest.Mocked<Pick<CreateUserUseCase, 'execute'>>;

  const now = new Date('2025-06-01T12:00:00.000Z');

  beforeEach(async () => {
    createUser = { execute: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: APP_PIPE, useClass: AppZodValidationPipe },
        {
          provide: CreateUserUseCase,
          useValue: createUser,
        },
      ],
    }).compile();

    app = await createNestFastifyTestingApp(moduleFixture, async (a) => {
      a.useGlobalFilters(new HttpExceptionFilter());
      a.setGlobalPrefix('api/v1');
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 409 when use case throws email already exists', () => {
    createUser.execute.mockRejectedValue(
      new ApplicationException(USER_API_ERROR_CODES.EMAIL_ALREADY_EXISTS, 'Registration failed'),
    );

    return requestNest(app)
      .post('/api/v1/users')
      .send({
        name: 'Dan',
        email: 'dan@example.com',
        password: 'password12',
      })
      .expect(409)
      .expect((res) => {
        expect(res.body).toMatchObject({
          success: false,
          code: USER_API_ERROR_CODES.EMAIL_ALREADY_EXISTS,
        });
      });
  });

  it('returns 400 when body fails Zod validation', () => {
    return requestNest(app)
      .post('/api/v1/users')
      .send({ name: '', email: 'not-email', password: 'short' })
      .expect(400);
  });

  it('returns 201 and public shape without password on success', async () => {
    const id = randomUUID();
    createUser.execute.mockResolvedValue(
      UserEntity.create({
        id,
        name: 'Carol',
        email: 'carol@example.com',
        emailVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    );

    const res = await requestNest(app)
      .post('/api/v1/users')
      .send({
        name: 'Carol',
        email: 'carol@example.com',
        password: 'password12',
      })
      .expect(201);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).toMatchObject({
      id,
      name: 'Carol',
      email: 'carol@example.com',
      emailVerified: false,
    });
    expect(typeof res.body.createdAt).toBe('string');
  });
});
