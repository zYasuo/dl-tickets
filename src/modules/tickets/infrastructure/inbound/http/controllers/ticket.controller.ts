import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RateLimitEndpoint } from 'src/common/rate-limit/rate-limit-endpoint.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { toTicketPublicHttp, type TTicketPublicHttp } from '../mappers/ticket-http.mapper';
import { CreateTicketUseCase } from 'src/modules/tickets/application/use-case/create-ticket.use-case';
import { FindAllTicketsUseCase } from 'src/modules/tickets/application/use-case/find-all-tickets.use-case';
import { UpdateTicketUseCase } from 'src/modules/tickets/application/use-case/update-ticket.use-case';
import {
  SCreateTicket,
  type TCreateTicket,
} from 'src/modules/tickets/application/dto/create-ticket.dto';
import {
  SFindAllTicket,
  type TFindAllTicket,
} from 'src/modules/tickets/application/dto/find-all-ticket.dto';
import {
  SUpdateTicket,
  type TUpdateTicket,
} from 'src/modules/tickets/application/dto/update-ticket.dto';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';

@Controller('tickets')
export class TicketController {
  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly findAllTicketsUseCase: FindAllTicketsUseCase,
    private readonly updateTicketUseCase: UpdateTicketUseCase,
  ) {}

  @RateLimitEndpoint('tickets-list')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(SFindAllTicket)) query: TFindAllTicket,
  ): Promise<PaginatedResult<TTicketPublicHttp>> {
    const result = await this.findAllTicketsUseCase.execute(query);

    return {
      data: result.data.map(toTicketPublicHttp),
      meta: result.meta,
    };
  }

  @RateLimitEndpoint('tickets-create')
  @Post()
  async create(
    @Body(new ZodValidationPipe(SCreateTicket)) dto: TCreateTicket,
  ): Promise<TTicketPublicHttp> {
    const ticket = await this.createTicketUseCase.execute(dto);
    return toTicketPublicHttp(ticket);
  }

  @RateLimitEndpoint('tickets-update')
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(SUpdateTicket)) dto: TUpdateTicket,
  ): Promise<TTicketPublicHttp> {
    const ticket = await this.updateTicketUseCase.execute(id, dto);
    return toTicketPublicHttp(ticket);
  }
}
