import { PasswordResetEntity } from '../../entities/password-reset.entity';

export abstract class PasswordResetRepositoryPort {
  abstract create(reset: PasswordResetEntity): Promise<PasswordResetEntity>;
  abstract findByTokenHash(tokenHash: string): Promise<PasswordResetEntity | null>;
  abstract markAsUsed(id: number): Promise<void>;
}
