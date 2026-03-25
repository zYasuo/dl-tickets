import { Module } from '@nestjs/common';
import { DbModule } from 'src/modules/users/infrastructure/outbound/persistence/db/db.module';
import { UserController } from 'src/modules/users/infrastructure/inbound/http/controllers/user.controller';
import { CreateUserUseCase } from 'src/modules/users/application/use-cases/create-user.use-case';
import { UserRepository } from 'src/modules/users/infrastructure/outbound/persistence/repositories/user.repository';
import { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
import { PasswordHasherPort } from 'src/modules/users/domain/ports/security/password-hasher.port';
import { Argon2PasswordHasher } from 'src/modules/users/infrastructure/outbound/security/argon2-password-hasher.security';

@Module({
  imports: [DbModule],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    {
      provide: UserRepositoryPort,
      useClass: UserRepository,
    },
    {
      provide: PasswordHasherPort,
      useClass: Argon2PasswordHasher,
    },
  ],
})
export class UsersModule {}
