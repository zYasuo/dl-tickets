import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import { PrismaService } from 'nestjs-prisma';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';

@Injectable()
export class UserRepository extends UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(user: UserEntity): Promise<UserEntity> {
    const row = await this.prisma.user.create({
      data: {
        uuid: user.id,
        name: user.name.value,
        email: user.email.value,
        password: user.password.value,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

    return UserEntity.create({
      id: row.uuid,
      name: row.name,
      email: row.email,
      password: row.password,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });

    if (!row) {
      return null;
    }

    return UserEntity.create({
      id: row.uuid,
      name: row.name,
      email: row.email,
      password: row.password,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByUuid(uuid: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { uuid } });

    if (!row) {
      return null;
    }

    return UserEntity.create({
      id: row.uuid,
      name: row.name,
      email: row.email,
      password: row.password,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByInternalId(id: number): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });

    if (!row) {
      return null;
    }

    return UserEntity.create({
      id: row.uuid,
      name: row.name,
      email: row.email,
      password: row.password,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async getInternalIdByUuid(uuid: string): Promise<number> {
    const row = await this.prisma.user.findUnique({
      where: { uuid },
      select: { id: true },
    });

    if (!row) {
      throw new NotFoundException('User not found');
    }

    return row.id;
  }

  async updatePassword(internalId: number, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: internalId },
      data: { password: hashedPassword },
    });
  }
}
