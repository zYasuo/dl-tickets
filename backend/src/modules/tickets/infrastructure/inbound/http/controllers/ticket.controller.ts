import { Body, Controller, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { RateLimitEndpoint } from 'src/common/rate-limit/rate-limit-endpoint.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';
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
import { ApiTickets, TicketDoc } from '../docs/ticket-doc.decorator';
import { toTicketPublicHttp, type TTicketPublicHttp } from '../mappers/ticket-http.mapper';
import {
  CurrentUser,
  type TAuthUser,
} from 'src/modules/auth/infrastructure/inbound/http/decorators/current-user.decorator';

@Controller('tickets')
@ApiTickets()
export class TicketController {
  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly findAllTicketsUseCase: FindAllTicketsUseCase,
    private readonly updateTicketUseCase: UpdateTicketUseCase,
  ) {}

  @RateLimitEndpoint('tickets-list')
  @TicketDoc.List()
  async findAll(
    @Query(new ZodValidationPipe(SFindAllTicket)) query: TFindAllTicket,
    @CurrentUser() user: TAuthUser,
  ): Promise<PaginatedResult<TTicketPublicHttp>> {
    const result = await this.findAllTicketsUseCase.execute(query, user.sub);

    return {
      data: result.data.map(toTicketPublicHttp),
      meta: result.meta,
    };
  }

  @RateLimitEndpoint('tickets-create')
  @TicketDoc.Create()
  async create(
    @Body(new ZodValidationPipe(SCreateTicket)) dto: TCreateTicket,
    @CurrentUser() user: TAuthUser,
  ): Promise<TTicketPublicHttp> {
    const ticket = await this.createTicketUseCase.execute(dto, user.sub);
    return toTicketPublicHttp(ticket);
  }

  @RateLimitEndpoint('tickets-update')
  @TicketDoc.Update()
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(SUpdateTicket)) dto: TUpdateTicket,
    @CurrentUser() user: TAuthUser,
  ): Promise<TTicketPublicHttp> {
    const ticket = await this.updateTicketUseCase.execute(id, user.sub, dto);
    return toTicketPublicHttp(ticket);
  }
}
