import { Injectable } from '@nestjs/common';
import type { Country } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { CountryEntity } from 'src/modules/locations/domain/entities/country.entity';
import { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';

function toDomain(row: Country): CountryEntity {
  return CountryEntity.create({
    id: row.uuid,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class CountryRepository extends CountryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(entity: CountryEntity): Promise<CountryEntity> {
    const row = await this.prisma.country.create({
      data: {
        uuid: entity.id,
        name: entity.name,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
    });
    return toDomain(row);
  }

  async findByUuid(uuid: string): Promise<CountryEntity | null> {
    const row = await this.prisma.country.findUnique({ where: { uuid } });
    return row ? toDomain(row) : null;
  }

  async findAll(): Promise<CountryEntity[]> {
    const rows = await this.prisma.country.findMany({ orderBy: { name: 'asc' } });
    return rows.map(toDomain);
  }

  async update(entity: CountryEntity): Promise<CountryEntity> {
    const row = await this.prisma.country.update({
      where: { uuid: entity.id },
      data: { name: entity.name, updatedAt: entity.updatedAt },
    });
    return toDomain(row);
  }

  async deleteByUuid(uuid: string): Promise<void> {
    await this.prisma.country.delete({ where: { uuid } });
  }
}
