import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ConcurrencyError } from 'src/common/errors/concurrency.error';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import { PrismaService } from 'nestjs-prisma';
import type { ClientContractListCriteria } from 'src/modules/client-contracts/domain/criteria/client-contract-list.criteria';
import { ClientContractEntity } from 'src/modules/client-contracts/domain/entities/client-contract.entity';
import { ClientContractRepositoryPort } from 'src/modules/client-contracts/domain/ports/repository/client-contract.repository.port';
import {
  toDomain,
  toPrismaCreate,
  toPrismaUpdate,
} from '../mappers/client-contract-persistence.mapper';
const clientInclude = { client: { select: { uuid: true } } } as const;

@Injectable()
export class ClientContractRepository extends ClientContractRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  async create(contract: ClientContractEntity): Promise<ClientContractEntity> {
    const clientRow = await this.prisma.client.findUniqueOrThrow({
      where: { uuid: contract.clientId },
      select: { id: true },
    });
    const row = await this.prisma.clientContract.create({
      data: toPrismaCreate(contract, clientRow.id),
      include: clientInclude,
    });
    return toDomain(row);
  }
  async findAll(
    criteria: ClientContractListCriteria,
  ): Promise<PaginatedResult<ClientContractEntity>> {
    const { page, limit, cursor, sortBy, sortOrder, clientId, status } = criteria;
    const businessFilters: Prisma.ClientContractWhereInput[] = [];
    if (clientId?.trim()) {
      businessFilters.push({ client: { uuid: clientId.trim() } });
    }
    if (status) {
      businessFilters.push({ status });
    }
    const whereForCount: Prisma.ClientContractWhereInput =
      businessFilters.length === 0 ? {} : { AND: businessFilters };
    const pageFilters: Prisma.ClientContractWhereInput[] = [...businessFilters];
    if (cursor) {
      pageFilters.push({ uuid: { gt: cursor } });
    }
    const whereForPage: Prisma.ClientContractWhereInput =
      pageFilters.length === 0 ? {} : { AND: pageFilters };
    const skip = cursor ? 0 : (page - 1) * limit;
    const orderBy: Prisma.ClientContractOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };
    const [rows, total] = await Promise.all([
      this.prisma.clientContract.findMany({
        where: whereForPage,
        orderBy,
        skip,
        take: limit,
        include: clientInclude,
      }),
      this.prisma.clientContract.count({ where: whereForCount }),
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
  async findById(uuid: string): Promise<ClientContractEntity | null> {
    const row = await this.prisma.clientContract.findUnique({
      where: { uuid },
      include: clientInclude,
    });
    if (!row) return null;
    return toDomain(row);
  }
  async update(contract: ClientContractEntity): Promise<ClientContractEntity> {
    const result = await this.prisma.clientContract.updateMany({
      where: {
        uuid: contract.id,
        updatedAt: contract.updatedAt,
      },
      data: toPrismaUpdate(contract),
    });
    if (result.count === 0) {
      throw new ConcurrencyError(
        'Contract was updated or removed by another request; reload and try again',
      );
    }
    const row = await this.prisma.clientContract.findUniqueOrThrow({
      where: { uuid: contract.id },
      include: clientInclude,
    });
    return toDomain(row);
  }
}
