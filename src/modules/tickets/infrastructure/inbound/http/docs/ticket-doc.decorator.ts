import { applyDecorators, Get, Patch, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { standardError } from 'src/common/openapi/standard-error-doc.helper';
import { CreateTicketBodyDto } from 'src/modules/tickets/application/dto/create-ticket.dto';
import { UpdateTicketBodyDto } from 'src/modules/tickets/application/dto/update-ticket.dto';
import {
  TicketListEnvelopeOpenApiDto,
  TicketSingleEnvelopeOpenApiDto,
} from '../schemas/ticket-public-http.openapi.dto';

export function ApiTickets() {
  return ApiTags('Tickets');
}

export class TicketDoc {
  static List() {
    return applyDecorators(
      Get(),
      ApiOperation({ summary: 'List tickets (pagination)' }),
      ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
      ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
      ApiQuery({ name: 'cursor', required: false, type: String, format: 'uuid' }),
      ApiQuery({ name: 'createdFrom', required: false, type: String, example: '2025-01-01' }),
      ApiQuery({ name: 'createdTo', required: false, type: String, example: '2025-12-31' }),
      ApiQuery({
        name: 'sortBy',
        required: false,
        enum: ['title', 'status', 'updatedAt', 'createdAt'],
      }),
      ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] }),
      ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'IN_PROGRESS', 'DONE'] }),
      ApiResponse({
        status: 200,
        description:
          'Paginated list. Actual response wraps payload in `{ success, timestamp, data: { data, meta } }`.',
        type: TicketListEnvelopeOpenApiDto,
      }),
      standardError(400, 'Invalid query'),
      standardError(429, 'Rate limit'),
    );
  }

  static Create() {
    return applyDecorators(
      Post(),
      ApiOperation({ summary: 'Create ticket' }),
      ApiBody({ type: CreateTicketBodyDto }),
      ApiResponse({
        status: 201,
        description:
          'Ticket created. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: TicketSingleEnvelopeOpenApiDto,
      }),
      standardError(400, 'Zod validation'),
      standardError(429, 'Rate limit'),
    );
  }

  static Update() {
    return applyDecorators(
      Patch(':id'),
      ApiOperation({ summary: 'Update ticket (optimistic locking)' }),
      ApiParam({ name: 'id', format: 'uuid' }),
      ApiBody({ type: UpdateTicketBodyDto }),
      ApiResponse({
        status: 200,
        description:
          'Ticket updated. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: TicketSingleEnvelopeOpenApiDto,
      }),
      standardError(400, 'Zod validation'),
      standardError(404, 'Ticket not found'),
      standardError(409, 'Concurrency: stale `updatedAt`'),
      standardError(429, 'Rate limit'),
    );
  }
}
