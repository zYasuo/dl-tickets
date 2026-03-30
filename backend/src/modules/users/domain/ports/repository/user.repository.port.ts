import { UserEntity } from '../../entities/user.entity';

export abstract class UserRepositoryPort {
  abstract create(user: UserEntity): Promise<UserEntity>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findByUuid(uuid: string): Promise<UserEntity | null>;
  abstract findByInternalId(id: number): Promise<UserEntity | null>;
  abstract getInternalIdByUuid(uuid: string): Promise<number>;
  abstract updatePassword(internalId: number, hashedPassword: string): Promise<void>;
}