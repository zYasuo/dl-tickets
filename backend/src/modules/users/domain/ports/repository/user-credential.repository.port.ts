import type {
  CreateUserCredentialInput,
  UserCredentialEntity,
} from '../../entities/user-credential.entity';

export abstract class UserCredentialRepositoryPort {
  abstract create(input: CreateUserCredentialInput): Promise<UserCredentialEntity>;
  abstract findByUserId(userId: number): Promise<UserCredentialEntity | null>;
  abstract updatePasswordHash(userId: number, hash: string): Promise<void>;
  abstract recordFailedLoginAttempt(userId: number): Promise<void>;
  abstract clearLoginLockout(userId: number): Promise<void>;
}
