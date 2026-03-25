import { Controller, Post, Body } from '@nestjs/common';
import { RateLimitEndpoint } from 'src/common/rate-limit/rate-limit-endpoint.decorator';
import { CreateUserUseCase } from 'src/modules/users/application/use-cases/create-user.use-case';
import { SCreateUser, type TCreateUser } from 'src/modules/users/application/dto/create-user.dto';
import { ZodValidationPipe } from '../../../../../../common/pipes/zod-validation.pipe';
import {
  toUserPublicHttp,
  type UserPublicHttp,
} from '../mappers/user-http.mapper';

@Controller('users')
export class UserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @RateLimitEndpoint('users-register')
  @Post()
  async create(
    @Body(new ZodValidationPipe(SCreateUser)) dto: TCreateUser,
  ): Promise<UserPublicHttp> {
    const user = await this.createUserUseCase.execute(dto);
    return toUserPublicHttp(user);
  }
}
