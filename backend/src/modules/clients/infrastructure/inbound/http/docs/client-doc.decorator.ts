import { applyDecorators, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OPENAPI_ACCESS_TOKEN_SCHEME } from 'src/common/openapi/openapi-access-token-scheme.constant';
import { standardError } from 'src/common/openapi/standard-error-doc.helper';
import { CreateClientBodyDto } from 'src/modules/clients/application/dto/create-client.dto';
import {
  ClientListEnvelopeOpenApiDto,
  ClientSingleEnvelopeOpenApiDto,
} from '../schemas/client-public-http.openapi.dto';

export function ApiClients() {
  return applyDecorators(ApiTags('Clients'), ApiBearerAuth(OPENAPI_ACCESS_TOKEN_SCHEME));
}

export class ClientDoc {
  static List() {
    return applyDecorators(
      Get(),
      ApiOperation({ summary: 'List clients (pagination)' }),
      ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
      ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
      ApiQuery({ name: 'cursor', required: false, type: String, format: 'uuid' }),
      ApiQuery({
        name: 'sortBy',
        required: false,
        enum: ['name', 'createdAt', 'updatedAt'],
      }),
      ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] }),
      ApiQuery({ name: 'name', required: false, type: String }),
      ApiResponse({
        status: 200,
        description:
          'Paginated list. Actual response wraps payload in `{ success, timestamp, data: { data, meta } }`.',
        type: ClientListEnvelopeOpenApiDto,
      }),
      standardError(400, 'Invalid query'),
      standardError(401, 'Unauthorized'),
      standardError(429, 'Rate limit'),
    );
  }

  static FindById() {
    return applyDecorators(
      Get(':id'),
      ApiOperation({ summary: 'Get client by id' }),
      ApiParam({ name: 'id', format: 'uuid' }),
      ApiResponse({
        status: 200,
        description:
          'Client found. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: ClientSingleEnvelopeOpenApiDto,
      }),
      standardError(401, 'Unauthorized'),
      standardError(404, 'Client not found'),
      standardError(429, 'Rate limit'),
    );
  }

  static Create() {
    return applyDecorators(
      Post(),
      ApiOperation({
        summary: 'Create client',
        description:
          'Requires a valid JWT (global JwtAuthGuard). Creates a business Client (attended customer), not a system User.',
      }),
      ApiBody({ type: CreateClientBodyDto }),
      ApiResponse({
        status: 201,
        description:
          'Client created. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: ClientSingleEnvelopeOpenApiDto,
      }),
      standardError(400, 'Zod validation / domain rules'),
      standardError(401, 'Unauthorized'),
      standardError(409, 'Duplicate CPF/CNPJ'),
      standardError(429, 'Rate limit'),
    );
  }
}
