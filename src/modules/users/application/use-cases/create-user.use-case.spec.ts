import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../domain/ports/repository/user.repository.port';
import { PasswordHasherPort } from '../../domain/ports/security/password-hasher.port';
import { CreateUserUseCase } from './create-user.use-case';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepository: jest.Mocked<Pick<UserRepositoryPort, 'findByEmail' | 'create'>>;
  let passwordHasher: jest.Mocked<Pick<PasswordHasherPort, 'hash'>>;

  const now = new Date('2025-01-01T00:00:00.000Z');

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
    };
    useCase = new CreateUserUseCase(
      userRepository as unknown as UserRepositoryPort,
      passwordHasher as unknown as PasswordHasherPort,
    );
  });

  it('throws ConflictException when email already exists', async () => {
    userRepository.findByEmail.mockResolvedValue(
      UserEntity.create({
        id: randomUUID(),
        name: 'Existing',
        email: 'a@b.com',
        password: 'hashed-existing-password',
        createdAt: now,
        updatedAt: now,
      }),
    );

    await expect(
      useCase.execute({
        name: 'New',
        email: 'a@b.com',
        password: 'password12',
      }),
    ).rejects.toThrow(ConflictException);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('hashes password then persists user', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('argon2-hash-value');

    const created = UserEntity.create({
      id: 'user-id-1',
      name: 'Alice',
      email: 'alice@example.com',
      password: 'argon2-hash-value',
      createdAt: now,
      updatedAt: now,
    });
    userRepository.create.mockResolvedValue(created);

    const result = await useCase.execute({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password12',
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('password12');
    expect(userRepository.create).toHaveBeenCalled();
    const arg = userRepository.create.mock.calls[0][0];
    expect(arg.password.value).toBe('argon2-hash-value');
    expect(result.email.value).toBe('alice@example.com');
  });

  it('throws InternalServerErrorException when repository returns null', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-password-ok');
    userRepository.create.mockResolvedValue(null as unknown as UserEntity);

    await expect(
      useCase.execute({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'password12',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
