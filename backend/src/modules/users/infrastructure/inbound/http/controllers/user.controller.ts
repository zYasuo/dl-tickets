import { Body, Controller } from '@nestjs/common';
import { Public } from 'src/modules/auth/infrastructure/inbound/http/decorators/public.decorator';
import { RateLimitEndpoint } from 'src/common/rate-limit/rate-limit-endpoint.decorator';
import { CreateUserUseCase } from 'src/modules/users/application/use-cases/create-user.use-case';
import { CreateUserBodyDto } from 'src/modules/users/application/dto/create-user.dto';
import { toUserPublicHttp, type UserPublicHttp } from '../mappers/user-http.mapper';
import { ApiUsers, UserDoc } from '../docs/user-doc.decorator';

@Controller('users')
@ApiUsers()
export class UserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Public()
  @RateLimitEndpoint('users-register')
  @UserDoc.Create()
  async create(@Body() dto: CreateUserBodyDto): Promise<UserPublicHttp> {
    const user = await this.createUserUseCase.execute(dto);
    return toUserPublicHttp(user);
  }
}
