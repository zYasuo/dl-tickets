import { UserEntity } from '../../entities/user.entity';

export abstract class UserRepositoryPort {
  abstract create(user: UserEntity): Promise<UserEntity>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
}