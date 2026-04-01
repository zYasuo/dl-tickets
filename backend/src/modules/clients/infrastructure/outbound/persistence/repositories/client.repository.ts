import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import type { ClientListCriteria } from 'src/modules/clients/domain/criteria/client-list.criteria';
import type { SearchByAddressCriteria } from 'src/modules/clients/domain/criteria/search-by-address.criteria';
import { ClientEntity } from 'src/modules/clients/domain/entities/client.entity';
import { ClientRepositoryPort } from 'src/modules/clients/domain/ports/repository/client.repository.port';
import {
  addressSearchRowToPrismaClient,
  escapeIlikePattern,
  type ClientAddressSearchRow,
} from '../mappers/client-address-search-persistence.mapper';
import {
  clientPersistenceInclude,
  toDomain,
  toDomainFromScalar,
  toPrismaCreate,
} from '../mappers/client-persistence.mapper';

@Injectable()
export class ClientRepository extends ClientRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(client: ClientEntity): Promise<ClientEntity> {
    const row = await this.prisma.client.create({
      data: toPrismaCreate(client),
      include: clientPersistenceInclude,
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
        include: clientPersistenceInclude,
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
    const row = await this.prisma.client.findUnique({
      where: { uuid },
      include: clientPersistenceInclude,
    });
    if (!row) return null;
    return toDomain(row);
  }

  async findByInternalId(id: number): Promise<ClientEntity | null> {
    const row = await this.prisma.client.findUnique({
      where: { id },
      include: clientPersistenceInclude,
    });
    if (!row) return null;
    return toDomain(row);
  }

  async findByCpf(digits: string): Promise<ClientEntity | null> {
    const row = await this.prisma.client.findUnique({
      where: { cpf: digits },
      include: clientPersistenceInclude,
    });
    if (!row) return null;
    return toDomain(row);
  }

  async findByCnpj(digits: string): Promise<ClientEntity | null> {
    const row = await this.prisma.client.findUnique({
      where: { cnpj: digits },
      include: clientPersistenceInclude,
    });
    if (!row) return null;
    return toDomain(row);
  }

  async searchByAddress(criteria: SearchByAddressCriteria): Promise<PaginatedResult<ClientEntity>> {
    const { term, page, limit } = criteria;
    const trimmed = term.trim();
    const pattern = `%${escapeIlikePattern(trimmed)}%`;
    const skip = (page - 1) * limit;

    const addressPredicate = Prisma.sql`(
      COALESCE(c.street, '') || ' ' || COALESCE(c.address_number, '') || ' ' ||
      COALESCE(c.complement, '') || ' ' || COALESCE(c.neighborhood, '') || ' ' ||
      COALESCE(c.city, '') || ' ' || COALESCE(c.state, '') || ' ' || COALESCE(c.zip_code, '')
    ) ILIKE ${pattern} ESCAPE '\\'`;

    const [countRows, rows] = await Promise.all([
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count
        FROM clients c
        WHERE ${addressPredicate}
      `,
      this.prisma.$queryRaw<ClientAddressSearchRow[]>`
        SELECT c.id, c.uuid, c.name, c.cpf, c.cnpj, c.street, c.address_number, c.complement,
               c.neighborhood, c.city, c.state, c.zip_code, c.created_at, c.updated_at
        FROM clients c
        WHERE ${addressPredicate}
        ORDER BY c.id ASC
        LIMIT ${limit} OFFSET ${skip}
      `,
    ]);

    const total = Number(countRows[0]?.count ?? 0);
    const data = rows.map((row) => toDomainFromScalar(addressSearchRowToPrismaClient(row)));
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextCursor: data.at(-1)?.id ?? null,
      },
    };
  }
}
