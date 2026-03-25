import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ConcurrencyError } from 'src/common/errors/concurrency.error';
import { PrismaService } from 'nestjs-prisma';
import { TicketEntity, TicketStatus } from 'src/modules/tickets/domain/entities/ticket.entity';
import { TicketRepositoryPort } from 'src/modules/tickets/domain/ports/repository/ticket.repository.port';
import type { TicketListCriteria } from 'src/modules/tickets/domain/criteria/ticket-list.criteria';
import { Description } from 'src/modules/tickets/domain/vo/description.vo';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';

@Injectable()
export class TicketRepository extends TicketRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAll(criteria: TicketListCriteria): Promise<PaginatedResult<TicketEntity>> {
    const {
      page,
      limit,
      cursor,
      createdFrom,
      createdTo,
      sortBy,
      sortOrder,
      status,
    } = criteria;

    const andParts: Prisma.TicketsWhereInput[] = [];

    const createdAt: { gte?: Date; lte?: Date } = {};
    if (createdFrom) {
      createdAt.gte = new Date(`${createdFrom}T00:00:00.000Z`);
    }
    if (createdTo) {
      createdAt.lte = new Date(`${createdTo}T23:59:59.999Z`);
    }
    if (Object.keys(createdAt).length > 0) {
      andParts.push({ createdAt });
    }
    if (cursor) {
      andParts.push({ id: { gt: cursor } });
    }
    if (status) {
      andParts.push({ status });
    }

    const where: Prisma.TicketsWhereInput =
      andParts.length === 0 ? {} : { AND: andParts };
    const skip = cursor ? 0 : (page - 1) * limit;

    const orderBy: Prisma.TicketsOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [rows, total] = await Promise.all([
      this.prisma.tickets.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.tickets.count({ where }),
    ]);

    const data = rows.map((row) =>
      TicketEntity.create({
        id: row.id,
        title: row.title,
        description: Description.create(row.description),
        status: row.status as TicketStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        userId: row.userId,
      }),
    );

    const totalPages = Math.ceil(total / limit);
    const lastItem = data.at(-1);

    return {
      data,
      meta: {
        total,
        page: cursor ? 1 : page,
        limit,
        totalPages,
        hasNextPage: cursor ? data.length === limit : page < totalPages,
        hasPreviousPage: cursor ? true : page > 1,
        nextCursor: lastItem?.id ?? null,
      },
    };
  }

  async create(ticket: TicketEntity): Promise<TicketEntity> {
    const row = await this.prisma.tickets.create({
      data: {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description.value,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        userId: ticket.userId,
      },
    });

    return TicketEntity.create({
      id: row.id,
      title: row.title,
      description: Description.create(row.description),
      status: row.status as TicketStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      userId: row.userId,
    });
  }

  async findById(id: string): Promise<TicketEntity | null> {
    const row = await this.prisma.tickets.findUnique({ where: { id } });

    if (!row) {
      return null;
    }

    return TicketEntity.create({
      id: row.id,
      title: row.title,
      description: Description.create(row.description),
      status: row.status as TicketStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      userId: row.userId,
    });
  }

  async findByUserId(userId: string): Promise<TicketEntity[]> {
    const rows = await this.prisma.tickets.findMany({ where: { userId } });
    return rows.map((row) =>
      TicketEntity.create({
        id: row.id,
        title: row.title,
        description: Description.create(row.description),
        status: row.status as TicketStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        userId: row.userId,
      }),
    );
  }

  async update(ticket: TicketEntity): Promise<TicketEntity> {
    const description = Description.create(ticket.description.value);

    const result = await this.prisma.tickets.updateMany({
      where: {
        id: ticket.id,
        updatedAt: ticket.updatedAt,
      },
      data: {
        title: ticket.title,
        description: description.value,
        status: ticket.status,
      },
    });

    if (result.count === 0) {
      throw new ConcurrencyError(
        'Ticket was updated or removed by another request; reload and try again',
      );
    }

    const row = await this.prisma.tickets.findUniqueOrThrow({ where: { id: ticket.id } });

    return TicketEntity.create({
      id: row.id,
      title: row.title,
      description: Description.create(row.description),
      status: row.status as TicketStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      userId: row.userId,
    });
  }
}
