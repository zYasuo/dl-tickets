import { ConflictException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { requestNest } from 'src/test-support/supertest-nest-app';
import { CreateUserUseCase } from 'src/modules/users/application/use-cases/create-user.use-case';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import { UserController } from './user.controller';

describe('UserController (integration)', () => {
  let app: INestApplication;
  let createUser: jest.Mocked<Pick<CreateUserUseCase, 'execute'>>;

  const now = new Date('2025-06-01T12:00:00.000Z');

  beforeEach(async () => {
    createUser = { execute: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: CreateUserUseCase,
          useValue: createUser,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 409 when use case throws ConflictException', () => {
    createUser.execute.mockRejectedValue(new ConflictException('Registration failed'));

    return requestNest(app)
      .post('/api/v1/users')
      .send({
        name: 'Dan',
        email: 'dan@example.com',
        password: 'password12',
      })
      .expect(409);
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
        password: 'secret-hash-at-least-8',
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
    });
    expect(typeof res.body.createdAt).toBe('string');
  });
});
