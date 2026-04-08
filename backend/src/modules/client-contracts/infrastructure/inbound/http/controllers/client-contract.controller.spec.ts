import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AppZodValidationPipe } from 'src/common/pipes/app-zod-validation.pipe';
import { randomUUID } from 'node:crypto';
import { requestNest } from 'src/test-support/supertest-nest-app';
import { CreateClientContractUseCase } from 'src/modules/client-contracts/application/use-cases/create-client-contract.use-case';
import { FindAllClientContractsUseCase } from 'src/modules/client-contracts/application/use-cases/find-all-client-contracts.use-case';
import { FindClientContractByIdUseCase } from 'src/modules/client-contracts/application/use-cases/find-client-contract-by-id.use-case';
import { UpdateClientContractUseCase } from 'src/modules/client-contracts/application/use-cases/update-client-contract.use-case';
import {
  ClientContractEntity,
  ClientContractStatus,
} from 'src/modules/client-contracts/domain/entities/client-contract.entity';
import { ClientContractController } from './client-contract.controller';

describe('ClientContractController', () => {
  let app: INestApplication;
  let createUc: jest.Mocked<Pick<CreateClientContractUseCase, 'execute'>>;
  let findAllUc: jest.Mocked<Pick<FindAllClientContractsUseCase, 'execute'>>;
  let findByIdUc: jest.Mocked<Pick<FindClientContractByIdUseCase, 'execute'>>;
  let updateUc: jest.Mocked<Pick<UpdateClientContractUseCase, 'execute'>>;
  const userId = randomUUID();

  beforeEach(async () => {
    createUc = { execute: jest.fn() };
    findAllUc = { execute: jest.fn() };
    findByIdUc = { execute: jest.fn() };
    updateUc = { execute: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ClientContractController],
      providers: [
        { provide: APP_PIPE, useClass: AppZodValidationPipe },
        { provide: CreateClientContractUseCase, useValue: createUc },
        { provide: FindAllClientContractsUseCase, useValue: findAllUc },
        { provide: FindClientContractByIdUseCase, useValue: findByIdUc },
        { provide: UpdateClientContractUseCase, useValue: updateUc },
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

  it('returns 400 for invalid list query', () => {
    return requestNest(app).get('/api/v1/client-contracts').query({ limit: 200 }).expect(400);
  });

  it('PATCH validates body', () => {
    return requestNest(app)
      .patch(`/api/v1/client-contracts/${randomUUID()}`)
      .send({ status: 'INVALID' })
      .expect(400);
  });

  it('GET by id returns contract shape', async () => {
    const id = randomUUID();
    const entity = ClientContractEntity.create({
      id,
      contractNumber: 'C1',
      clientId: randomUUID(),
      useClientAddress: true,
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      status: ClientContractStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    findByIdUc.execute.mockResolvedValue(entity);
    const res = await requestNest(app).get(`/api/v1/client-contracts/${id}`).expect(200);
    expect(res.body.contractNumber).toBe('C1');
    expect(res.body.useClientAddress).toBe(true);
  });
});
