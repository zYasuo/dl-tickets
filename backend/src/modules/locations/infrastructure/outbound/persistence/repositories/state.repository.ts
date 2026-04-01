import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { StateEntity } from 'src/modules/locations/domain/entities/state.entity';
import { StateRepositoryPort } from 'src/modules/locations/domain/ports/repository/state.repository.port';

type StateRow = {
  uuid: string;
  name: string;
  code: string | null;
  createdAt: Date;
  updatedAt: Date;
  country: { uuid: string };
};

function toDomain(row: StateRow): StateEntity {
  return StateEntity.create({
    id: row.uuid,
    name: row.name,
    code: row.code,
    countryId: row.country.uuid,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class StateRepository extends StateRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(entity: StateEntity): Promise<StateEntity> {
    const row = await this.prisma.state.create({
      data: {
        uuid: entity.id,
        name: entity.name,
        code: entity.code,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        country: { connect: { uuid: entity.countryId } },
      },
      include: { country: { select: { uuid: true } } },
    });
    return toDomain(row);
  }

  async findByUuid(uuid: string): Promise<StateEntity | null> {
    const row = await this.prisma.state.findUnique({
      where: { uuid },
      include: { country: { select: { uuid: true } } },
    });
    return row ? toDomain(row) : null;
  }

  async findByCountryUuid(countryUuid: string): Promise<StateEntity[]> {
    const rows = await this.prisma.state.findMany({
      where: { country: { uuid: countryUuid } },
      orderBy: { name: 'asc' },
      include: { country: { select: { uuid: true } } },
    });
    return rows.map(toDomain);
  }

  async update(entity: StateEntity): Promise<StateEntity> {
    const row = await this.prisma.state.update({
      where: { uuid: entity.id },
      data: {
        name: entity.name,
        code: entity.code,
        updatedAt: entity.updatedAt,
      },
      include: { country: { select: { uuid: true } } },
    });
    return toDomain(row);
  }

  async deleteByUuid(uuid: string): Promise<void> {
    await this.prisma.state.delete({ where: { uuid } });
  }
}
