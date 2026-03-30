import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { RefreshTokenEntity } from 'src/modules/auth/domain/entities/refresh-token.entity';
import { RefreshTokenRepositoryPort } from 'src/modules/auth/domain/ports/repository/refresh-token.repository.port';

@Injectable()
export class RefreshTokenRepository extends RefreshTokenRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(token: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    const row = await this.prisma.refreshToken.create({
      data: {
        tokenHash: token.tokenHash,
        familyId: token.familyId,
        userId: token.userId,
        expiresAt: token.expiresAt,
        revokedAt: token.revokedAt,
        createdAt: token.createdAt,
      },
    });

    return RefreshTokenEntity.create({
      id: row.id,
      tokenHash: row.tokenHash,
      familyId: row.familyId,
      userId: row.userId,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    const row = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
    });

    if (!row) return null;

    return RefreshTokenEntity.create({
      id: row.id,
      tokenHash: row.tokenHash,
      familyId: row.familyId,
      userId: row.userId,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    });
  }

  async revokeById(id: number): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllByUserId(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
