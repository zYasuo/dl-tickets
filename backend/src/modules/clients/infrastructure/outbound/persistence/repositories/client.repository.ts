import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import type { ClientListCriteria } from 'src/modules/clients/domain/criteria/client-list.criteria';
import { ClientEntity } from 'src/modules/clients/domain/entities/client.entity';
import { ClientRepositoryPort } from 'src/modules/clients/domain/ports/repository/client.repository.port';
import { toDomain, toPrismaCreate } from '../mappers/client-persistence.mapper';

@Injectable()
export class ClientRepository extends ClientRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(client: ClientEntity): Promise<ClientEntity> {
    const row = await this.prisma.client.create({
      data: toPrismaCreate(client),
    });
    return toDomain(row);
  }

  async findAll(criteria: ClientListCriteria): Promise<PaginatedResult<ClientEntity>> {
    const { page, limit, cursor, sortBy, sortOrder, name } = criteria;

    const businessFilters: Prisma.ClientWhereInput[] = [];
    if (name?.trim()) {
      businessFilters.push({
        name: { contains: name.trim(), mode: 'insensitive' },
      });
    }

    const whereForCount: Prisma.ClientWhereInput =
      businessFilters.length === 0 ? {} : { AND: businessFilters };

    const pageFilters: Prisma.ClientWhereInput[] = [...businessFilters];
    if (cursor) {
      pageFilters.push({ uuid: { gt: cursor } });
    }
    const whereForPage: Prisma.ClientWhereInput =
      pageFilters.length === 0 ? {} : { AND: pageFilters };

    const skip = cursor ? 0 : (page - 1) * limit;

    const orderBy: Prisma.ClientOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.findMany({
        where: whereForPage,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.client.count({ where: whereForCount }),
    ]);

    const data = rows.map((row) => toDomain(row));
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

  async findById(uuid: string): Promise<ClientEntity | null> {
    const row = await this.prisma.client.findUnique({ where: { uuid } });
    if (!row) return null;
    return toDomain(row);
  }

  async findByCpf(digits: string): Promise<ClientEntity | null> {
    const row = await this.prisma.client.findUnique({ where: { cpf: digits } });
    if (!row) return null;
    return toDomain(row);
  }

  async findByCnpj(digits: string): Promise<ClientEntity | null> {
    const row = await this.prisma.client.findUnique({ where: { cnpj: digits } });
    if (!row) return null;
    return toDomain(row);
  }
}
