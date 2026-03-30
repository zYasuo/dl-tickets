import { Module } from '@nestjs/common';
import { DbModule } from 'src/modules/users/infrastructure/outbound/persistence/db/db.module';
import { UserController } from 'src/modules/users/infrastructure/inbound/http/controllers/user.controller';
import { CreateUserUseCase } from 'src/modules/users/application/use-cases/create-user.use-case';
import { UserRepository } from 'src/modules/users/infrastructure/outbound/persistence/repositories/user.repository';
import { Argon2PasswordHasher } from 'src/modules/users/infrastructure/outbound/security/argon2-password-hasher.security';
import { PASSWORD_HASHER, USER_REPOSITORY } from 'src/di/tokens';

@Module({
  imports: [DbModule],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: Argon2PasswordHasher,
    },
  ],
  exports: [USER_REPOSITORY, PASSWORD_HASHER],
})
export class UsersModule {}
