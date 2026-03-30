import { RefreshTokenEntity } from '../../entities/refresh-token.entity';

export abstract class RefreshTokenRepositoryPort {
  abstract create(token: RefreshTokenEntity): Promise<RefreshTokenEntity>;
  abstract findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
  abstract revokeById(id: number): Promise<void>;
  abstract revokeByFamily(familyId: string): Promise<void>;
  abstract revokeAllByUserId(userId: number): Promise<void>;
}
