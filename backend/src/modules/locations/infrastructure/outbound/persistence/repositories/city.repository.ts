import { Injectable } from '@nestjs/common';
import type { City } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { CityEntity } from 'src/modules/locations/domain/entities/city.entity';
import type { CityWithStateSnapshot } from 'src/modules/locations/domain/ports/repository/city.repository.port';
import { CityRepositoryPort } from 'src/modules/locations/domain/ports/repository/city.repository.port';

type CityRow = City & { state: { uuid: string } };

function toDomain(row: CityRow): CityEntity {
  return CityEntity.create({
    id: row.uuid,
    name: row.name,
    stateId: row.state.uuid,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class CityRepository extends CityRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(entity: CityEntity): Promise<CityEntity> {
    const row = await this.prisma.city.create({
      data: {
        uuid: entity.id,
        name: entity.name,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        state: { connect: { uuid: entity.stateId } },
      },
      include: { state: { select: { uuid: true } } },
    });
    return toDomain(row);
  }

  async findByUuid(uuid: string): Promise<CityEntity | null> {
    const row = await this.prisma.city.findUnique({
      where: { uuid },
      include: { state: { select: { uuid: true } } },
    });
    return row ? toDomain(row) : null;
  }

  async findByUuidWithState(uuid: string): Promise<CityWithStateSnapshot | null> {
    const row = await this.prisma.city.findUnique({
      where: { uuid },
      include: { state: true },
    });
    if (!row) return null;
    return {
      uuid: row.uuid,
      name: row.name,
      state: {
        uuid: row.state.uuid,
        name: row.state.name,
        code: row.state.code,
      },
    };
  }

  async findByStateUuid(stateUuid: string): Promise<CityEntity[]> {
    const rows = await this.prisma.city.findMany({
      where: { state: { uuid: stateUuid } },
      orderBy: { name: 'asc' },
      include: { state: { select: { uuid: true } } },
    });
    return rows.map(toDomain);
  }

  async update(entity: CityEntity): Promise<CityEntity> {
    const row = await this.prisma.city.update({
      where: { uuid: entity.id },
      data: {
        name: entity.name,
        updatedAt: entity.updatedAt,
      },
      include: { state: { select: { uuid: true } } },
    });
    return toDomain(row);
  }

  async deleteByUuid(uuid: string): Promise<void> {
    await this.prisma.city.delete({ where: { uuid } });
  }
}
