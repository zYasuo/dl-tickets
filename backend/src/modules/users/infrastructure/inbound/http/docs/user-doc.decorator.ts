import { applyDecorators, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { standardError } from 'src/common/openapi/standard-error-doc.helper';
import { CreateUserBodyDto } from 'src/modules/users/application/dto/create-user.dto';
import { UserCreatedEnvelopeOpenApiDto } from '../schemas/user-public-http.openapi.dto';

export function ApiUsers() {
  return ApiTags('Users');
}

export class UserDoc {
  static Create() {
    return applyDecorators(
      Post(),
      ApiOperation({ summary: 'Register user' }),
      ApiBody({ type: CreateUserBodyDto }),
      ApiResponse({
        status: 201,
        description:
          'User created. Actual response wraps payload in `{ success, timestamp, data }` (see schema).',
        type: UserCreatedEnvelopeOpenApiDto,
      }),
      standardError(400, 'Zod validation / domain rules'),
      standardError(409, 'Registration failed'),
      standardError(429, 'Rate limit'),
    );
  }
}
