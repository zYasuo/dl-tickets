import { TCreateUser } from '../dto/create-user.dto';
import { UserEntity } from '../../domain/entities/user.entity';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PasswordHasherPort } from 'src/modules/users/domain/ports/security/password-hasher.port';
import { randomUUID } from 'node:crypto';
import { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: TCreateUser): Promise<UserEntity> {
    const { name, email, password } = input;
    const now = new Date();

    const existing = await this.userRepository.findByEmail(email);

    if (existing) {
      throw new ConflictException('Registration failed');
    }

    const hashedPassword = await this.passwordHasher.hash(password);

    const user = await this.userRepository.create(
      UserEntity.create({
        id: randomUUID(),
        name,
        email,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      }),
    );

    if (!user) {
      throw new InternalServerErrorException('Failed to create user');
    }

    return user;
  }
}
