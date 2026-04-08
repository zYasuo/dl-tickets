import { Body, Controller, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { RateLimitEndpoint } from 'src/common/rate-limit/rate-limit-endpoint.decorator';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import { CreateTicketUseCase } from 'src/modules/tickets/application/use-case/create-ticket.use-case';
import { FindAllTicketsUseCase } from 'src/modules/tickets/application/use-case/find-all-tickets.use-case';
import { UpdateTicketUseCase } from 'src/modules/tickets/application/use-case/update-ticket.use-case';
import { FindTicketByIdUseCase } from 'src/modules/tickets/application/use-case/find-ticket-by-id.use-case';
import { CreateTicketBodyDto } from 'src/modules/tickets/application/dto/create-ticket.dto';
import { FindAllTicketsQueryDto } from 'src/modules/tickets/application/dto/find-all-ticket.dto';
import { UpdateTicketBodyDto } from 'src/modules/tickets/application/dto/update-ticket.dto';
import { ApiTickets, TicketDoc } from '../docs/ticket-doc.decorator';
import { toTicketPublicHttp, type TicketPublicHttp } from '../mappers/ticket-http.mapper';
import {
  CurrentUser,
  type AuthUser,
} from 'src/modules/auth/infrastructure/inbound/http/decorators/current-user.decorator';

@Controller('tickets')
@ApiTickets()
export class TicketController {
  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly findAllTicketsUseCase: FindAllTicketsUseCase,
    private readonly findTicketByIdUseCase: FindTicketByIdUseCase,
    private readonly updateTicketUseCase: UpdateTicketUseCase,
  ) {}

  @RateLimitEndpoint('tickets-list')
  @TicketDoc.List()
  async findAll(
    @Query() query: FindAllTicketsQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<PaginatedResult<TicketPublicHttp>> {
    const result = await this.findAllTicketsUseCase.execute(query, user.sub);

    return {
      data: result.data.map(toTicketPublicHttp),
      meta: result.meta,
    };
  }

  @RateLimitEndpoint('tickets-get-by-id')
  @TicketDoc.FindById()
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<TicketPublicHttp> {
    const ticket = await this.findTicketByIdUseCase.execute(id, user.sub);
    return toTicketPublicHttp(ticket);
  }

  @RateLimitEndpoint('tickets-create')
  @TicketDoc.Create()
  async create(
    @Body() dto: CreateTicketBodyDto,
    @CurrentUser() user: AuthUser,
  ): Promise<TicketPublicHttp> {
    const ticket = await this.createTicketUseCase.execute(dto, user.sub);
    return toTicketPublicHttp(ticket);
  }

  @RateLimitEndpoint('tickets-update')
  @TicketDoc.Update()
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateTicketBodyDto,
    @CurrentUser() user: AuthUser,
  ): Promise<TicketPublicHttp> {
    const ticket = await this.updateTicketUseCase.execute(id, user.sub, dto);
    return toTicketPublicHttp(ticket);
  }
}
