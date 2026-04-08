import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AppZodValidationPipe } from 'src/common/pipes/app-zod-validation.pipe';
import { randomUUID } from 'node:crypto';
import { requestNest } from 'src/test-support/supertest-nest-app';
import { CreateTicketUseCase } from 'src/modules/tickets/application/use-case/create-ticket.use-case';
import { FindAllTicketsUseCase } from 'src/modules/tickets/application/use-case/find-all-tickets.use-case';
import { UpdateTicketUseCase } from 'src/modules/tickets/application/use-case/update-ticket.use-case';
import { FindTicketByIdUseCase } from 'src/modules/tickets/application/use-case/find-ticket-by-id.use-case';
import { Description } from 'src/modules/tickets/domain/vo/description.vo';
import { TicketEntity, TicketStatus } from 'src/modules/tickets/domain/entities/ticket.entity';
import { TicketController } from './ticket.controller';

describe('TicketController (integration)', () => {
  let app: INestApplication;
  let createTicket: jest.Mocked<Pick<CreateTicketUseCase, 'execute'>>;
  let findAllTickets: jest.Mocked<Pick<FindAllTicketsUseCase, 'execute'>>;
  let updateTicket: jest.Mocked<Pick<UpdateTicketUseCase, 'execute'>>;
  let findTicketById: jest.Mocked<Pick<FindTicketByIdUseCase, 'execute'>>;

  const now = new Date('2025-05-01T15:00:00.000Z');
  const userId = randomUUID();

  beforeEach(async () => {
    createTicket = { execute: jest.fn() };
    findAllTickets = { execute: jest.fn() };
    updateTicket = { execute: jest.fn() };
    findTicketById = { execute: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        { provide: APP_PIPE, useClass: AppZodValidationPipe },
        { provide: CreateTicketUseCase, useValue: createTicket },
        { provide: FindAllTicketsUseCase, useValue: findAllTickets },
        { provide: FindTicketByIdUseCase, useValue: findTicketById },
        { provide: UpdateTicketUseCase, useValue: updateTicket },
        {
          provide: APP_GUARD,
          useValue: {
            canActivate: (context: ExecutionContext) => {
              const req = context.switchToHttp().getRequest();
              req.user = { sub: userId, email: 'tester@example.com' };
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

  it('returns 400 for invalid query on GET /tickets', () => {
    return requestNest(app).get('/api/v1/tickets').query({ limit: 200 }).expect(400);
  });

  it('returns 400 when createdFrom is after createdTo', () => {
    return requestNest(app)
      .get('/api/v1/tickets')
      .query({ page: 1, limit: 10, createdFrom: '2025-06-01', createdTo: '2025-01-01' })
      .expect(400);
  });

  it('returns 200 and forwards query to use case', async () => {
    findAllTickets.execute.mockResolvedValue({
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

    await requestNest(app).get('/api/v1/tickets').query({ page: 1, limit: 10 }).expect(200);

    expect(findAllTickets.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
      userId,
    );
  });

  it('returns 200 and forwards createdFrom/createdTo to use case', async () => {
    findAllTickets.execute.mockResolvedValue({
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

    await requestNest(app)
      .get('/api/v1/tickets')
      .query({ page: 1, limit: 10, createdFrom: '2025-01-01', createdTo: '2025-01-31' })
      .expect(200);

    expect(findAllTickets.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        createdFrom: '2025-01-01',
        createdTo: '2025-01-31',
      }),
      userId,
    );
  });

  it('returns 400 for invalid body on POST /tickets', () => {
    return requestNest(app)
      .post('/api/v1/tickets')
      .send({ title: '', description: '' })
      .expect(400);
  });

  it('returns 400 when PATCH id is not a UUID v4', () => {
    return requestNest(app)
      .patch('/api/v1/tickets/not-a-uuid')
      .send({
        title: 'T',
        description: 'Valid length description here',
        status: TicketStatus.OPEN,
        updatedAt: now.toISOString(),
      })
      .expect(400);
  });

  it('returns 400 when GET /tickets/:id id is not a UUID v4', () => {
    return requestNest(app).get('/api/v1/tickets/not-a-uuid').expect(400);
  });

  it('returns 200 on GET /tickets/:id with valid uuid v4', async () => {
    const id = randomUUID();
    findTicketById.execute.mockResolvedValue(
      TicketEntity.create({
        id,
        title: 'One',
        description: Description.create('Body'),
        status: TicketStatus.OPEN,
        createdAt: now,
        updatedAt: now,
        userId,
      }),
    );

    const res = await requestNest(app).get(`/api/v1/tickets/${id}`).expect(200);

    expect(findTicketById.execute).toHaveBeenCalledWith(id, userId);
    expect(res.body).toMatchObject({
      id,
      title: 'One',
      description: 'Body',
      status: TicketStatus.OPEN,
    });
  });

  it('returns 200 on PATCH with valid uuid v4', async () => {
    const id = randomUUID();
    updateTicket.execute.mockResolvedValue(
      TicketEntity.create({
        id,
        title: 'Ok',
        description: Description.create('Desc'),
        status: TicketStatus.OPEN,
        createdAt: now,
        updatedAt: now,
        userId,
      }),
    );

    await requestNest(app)
      .patch(`/api/v1/tickets/${id}`)
      .send({
        title: 'Ok',
        description: 'Desc',
        status: TicketStatus.OPEN,
        updatedAt: now.toISOString(),
      })
      .expect(200);
  });
});
