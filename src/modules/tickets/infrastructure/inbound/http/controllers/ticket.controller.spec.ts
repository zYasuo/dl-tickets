import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { CreateTicketUseCase } from 'src/modules/tickets/application/use-case/create-ticket.use-case';
import { FindAllTicketsUseCase } from 'src/modules/tickets/application/use-case/find-all-tickets.use-case';
import { UpdateTicketUseCase } from 'src/modules/tickets/application/use-case/update-ticket.use-case';
import { Description } from 'src/modules/tickets/domain/vo/description.vo';
import { TicketEntity, TicketStatus } from 'src/modules/tickets/domain/entities/ticket.entity';
import { TicketController } from './ticket.controller';

describe('TicketController (integration)', () => {
  let app: INestApplication;
  let createTicket: jest.Mocked<Pick<CreateTicketUseCase, 'execute'>>;
  let findAllTickets: jest.Mocked<Pick<FindAllTicketsUseCase, 'execute'>>;
  let updateTicket: jest.Mocked<Pick<UpdateTicketUseCase, 'execute'>>;

  const now = new Date('2025-05-01T15:00:00.000Z');
  const userId = randomUUID();

  beforeEach(async () => {
    createTicket = { execute: jest.fn() };
    findAllTickets = { execute: jest.fn() };
    updateTicket = { execute: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        { provide: CreateTicketUseCase, useValue: createTicket },
        { provide: FindAllTicketsUseCase, useValue: findAllTickets },
        { provide: UpdateTicketUseCase, useValue: updateTicket },
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
    return request(app.getHttpServer()).get('/api/v1/tickets').query({ limit: 200 }).expect(400);
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

    await request(app.getHttpServer()).get('/api/v1/tickets').query({ page: 1, limit: 10 }).expect(200);

    expect(findAllTickets.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });

  it('returns 400 for invalid body on POST /tickets', () => {
    return request(app.getHttpServer())
      .post('/api/v1/tickets')
      .send({ userId: 'not-uuid', title: '', description: '', status: 'OPEN' })
      .expect(400);
  });

  it('returns 400 when PATCH id is not a UUID v4', () => {
    return request(app.getHttpServer())
      .patch('/api/v1/tickets/not-a-uuid')
      .send({
        title: 'T',
        description: 'Valid length description here',
        status: TicketStatus.OPEN,
        updatedAt: now.toISOString(),
      })
      .expect(400);
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

    await request(app.getHttpServer())
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
