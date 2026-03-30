import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { PasswordResetEntity } from 'src/modules/auth/domain/entities/password-reset.entity';
import { PasswordResetRepositoryPort } from 'src/modules/auth/domain/ports/repository/password-reset.repository.port';

@Injectable()
export class PasswordResetRepository extends PasswordResetRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(reset: PasswordResetEntity): Promise<PasswordResetEntity> {
    const row = await this.prisma.passwordReset.create({
      data: {
        tokenHash: reset.tokenHash,
        userId: reset.userId,
        expiresAt: reset.expiresAt,
        usedAt: reset.usedAt,
        createdAt: reset.createdAt,
      },
    });

    return PasswordResetEntity.create({
      id: row.id,
      tokenHash: row.tokenHash,
      userId: row.userId,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    });
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetEntity | null> {
    const row = await this.prisma.passwordReset.findFirst({
      where: { tokenHash },
    });

    if (!row) return null;

    return PasswordResetEntity.create({
      id: row.id,
      tokenHash: row.tokenHash,
      userId: row.userId,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    });
  }

  async markAsUsed(id: number): Promise<void> {
    await this.prisma.passwordReset.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
