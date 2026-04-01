import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { requestNest } from 'src/test-support/supertest-nest-app';
import { CreateClientUseCase } from 'src/modules/clients/application/use-cases/create-client.use-case';
import { FindAllClientsUseCase } from 'src/modules/clients/application/use-cases/find-all-clients.use-case';
import { FindClientByIdUseCase } from 'src/modules/clients/application/use-cases/find-client-by-id.use-case';
import { SearchClientsUseCase } from 'src/modules/clients/application/use-cases/search-clients.use-case';
import { ClientEntity } from 'src/modules/clients/domain/entities/client.entity';
import { Cpf } from 'src/modules/clients/domain/vo/cpf.vo';
import { Address } from 'src/common/vo/address.vo';
import { ClientController } from './client.controller';

describe('ClientController', () => {
  let app: INestApplication;
  let createClient: jest.Mocked<Pick<CreateClientUseCase, 'execute'>>;
  let findAll: jest.Mocked<Pick<FindAllClientsUseCase, 'execute'>>;
  let findById: jest.Mocked<Pick<FindClientByIdUseCase, 'execute'>>;
  let searchClients: jest.Mocked<Pick<SearchClientsUseCase, 'execute'>>;
  const userId = randomUUID();

  beforeEach(async () => {
    createClient = { execute: jest.fn() };
    findAll = { execute: jest.fn() };
    findById = { execute: jest.fn() };
    searchClients = { execute: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        { provide: CreateClientUseCase, useValue: createClient },
        { provide: FindAllClientsUseCase, useValue: findAll },
        { provide: FindClientByIdUseCase, useValue: findById },
        { provide: SearchClientsUseCase, useValue: searchClients },
        {
          provide: APP_GUARD,
          useValue: {
            canActivate: (context: ExecutionContext) => {
              const req = context.switchToHttp().getRequest();
              req.user = { sub: userId, email: 't@t.com' };
              return true;
            },
          } satisfies CanActivate,
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

  it('returns 400 for invalid query limit', () => {
    return requestNest(app).get('/api/v1/clients').query({ limit: 200 }).expect(400);
  });

  it('returns 400 when search q is empty', () => {
    return requestNest(app).get('/api/v1/clients/search').query({ q: '   ' }).expect(400);
  });

  it('GET forwards to use case', async () => {
    findAll.execute.mockResolvedValue({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        nextCursor: null,
      },
    });
    await requestNest(app).get('/api/v1/clients').query({ page: 1, limit: 10 }).expect(200);
    expect(findAll.execute).toHaveBeenCalled();
  });

  it('GET by id returns mapped client', async () => {
    const id = randomUUID();
    const entity = ClientEntity.create({
      id,
      name: 'N',
      cpf: Cpf.create('52998224725'),
      address: Address.create({
        street: 'A',
        number: '1',
        neighborhood: 'N',
        city: 'C',
        state: 'SP',
        zipCode: '01310100',
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    findById.execute.mockResolvedValue(entity);
    const res = await requestNest(app).get(`/api/v1/clients/${id}`).expect(200);
    expect(res.body.id).toBe(id);
    expect(res.body.cpf).toBe('52998224725');
  });
});
