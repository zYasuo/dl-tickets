import { Module } from '@nestjs/common';
import { TicketController } from 'src/modules/tickets/infrastructure/inbound/http/controllers/ticket.controller';
import { CreateTicketUseCase } from 'src/modules/tickets/application/use-case/create-ticket.use-case';
import { FindAllTicketsUseCase } from 'src/modules/tickets/application/use-case/find-all-tickets.use-case';
import { UpdateTicketUseCase } from 'src/modules/tickets/application/use-case/update-ticket.use-case';
import { TicketRepository } from 'src/modules/tickets/infrastructure/outbound/persistence/repositories/ticket.repository';
import { CacheModule } from '../cache/cache.module';
import { NotificationModule } from '../notifications/notification.module';
import { UsersModule } from '../users/users.module';
import { TicketCacheKeyBuilder } from './application/cache/ticket-key-builder.cache';
import { TICKET_REPOSITORY } from 'src/di/tokens';

@Module({
  imports: [CacheModule, NotificationModule, UsersModule],
  controllers: [TicketController],
  providers: [
    CreateTicketUseCase,
    FindAllTicketsUseCase,
    UpdateTicketUseCase,
    TicketCacheKeyBuilder,
    {
      provide: TICKET_REPOSITORY,
      useClass: TicketRepository,
    },
  ],
})
export class TicketsModule {}
