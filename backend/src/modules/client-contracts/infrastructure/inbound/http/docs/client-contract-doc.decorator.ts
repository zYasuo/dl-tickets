import { applyDecorators, Get, Patch, Post } from '@nestjs/common';
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
import { CreateClientContractBodyDto } from 'src/modules/client-contracts/application/dto/create-client-contract.dto';
import { UpdateClientContractBodyDto } from 'src/modules/client-contracts/application/dto/update-client-contract.dto';
import {
  ClientContractListEnvelopeOpenApiDto,
  ClientContractSingleEnvelopeOpenApiDto,
} from '../schemas/client-contract-public-http.openapi.dto';

export function ApiClientContracts() {
  return applyDecorators(
    ApiTags('Client contracts'),
    ApiBearerAuth(OPENAPI_ACCESS_TOKEN_SCHEME),
  );
}

export class ClientContractDoc {
  static List() {
    return applyDecorators(
      Get(),
      ApiOperation({ summary: 'List client contracts (pagination)' }),
      ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
      ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
      ApiQuery({ name: 'cursor', required: false, type: String, format: 'uuid' }),
      ApiQuery({
        name: 'sortBy',
        required: false,
        enum: ['contractNumber', 'startDate', 'createdAt', 'updatedAt'],
      }),
      ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] }),
      ApiQuery({ name: 'clientId', required: false, format: 'uuid' }),
      ApiQuery({
        name: 'status',
        required: false,
        enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
      }),
      ApiResponse({
        status: 200,
        description:
          'Paginated list. Actual response wraps payload in `{ success, timestamp, data: { data, meta } }`.',
        type: ClientContractListEnvelopeOpenApiDto,
      }),
      standardError(400, 'Invalid query'),
      standardError(401, 'Unauthorized'),
      standardError(429, 'Rate limit'),
    );
  }

  static FindById() {
    return applyDecorators(
      Get(':id'),
      ApiOperation({ summary: 'Get client contract by id' }),
      ApiParam({ name: 'id', format: 'uuid' }),
      ApiResponse({
        status: 200,
        description:
          'Contract found. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: ClientContractSingleEnvelopeOpenApiDto,
      }),
      standardError(401, 'Unauthorized'),
      standardError(404, 'Contract not found'),
      standardError(429, 'Rate limit'),
    );
  }

  static Create() {
    return applyDecorators(
      Post(),
      ApiOperation({
        summary: 'Create client contract',
        description: 'Requires a valid JWT. No persisted link to User — only the authenticated caller is implied by the request.',
      }),
      ApiBody({ type: CreateClientContractBodyDto }),
      ApiResponse({
        status: 201,
        description:
          'Contract created. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: ClientContractSingleEnvelopeOpenApiDto,
      }),
      standardError(400, 'Zod validation / domain rules'),
      standardError(401, 'Unauthorized'),
      standardError(404, 'Client not found'),
      standardError(429, 'Rate limit'),
    );
  }

  static Update() {
    return applyDecorators(
      Patch(':id'),
      ApiOperation({ summary: 'Update client contract' }),
      ApiParam({ name: 'id', format: 'uuid' }),
      ApiBody({ type: UpdateClientContractBodyDto }),
      ApiResponse({
        status: 200,
        description:
          'Contract updated. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: ClientContractSingleEnvelopeOpenApiDto,
      }),
      standardError(400, 'Zod validation / domain rules'),
      standardError(401, 'Unauthorized'),
      standardError(404, 'Contract not found'),
      standardError(429, 'Rate limit'),
    );
  }
}
