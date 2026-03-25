import { Module } from '@nestjs/common';
import { TicketController } from 'src/modules/tickets/infrastructure/inbound/http/controllers/ticket.controller';
import { CreateTicketUseCase } from 'src/modules/tickets/application/use-case/create-ticket.use-case';
import { FindAllTicketsUseCase } from 'src/modules/tickets/application/use-case/find-all-tickets.use-case';
import { UpdateTicketUseCase } from 'src/modules/tickets/application/use-case/update-ticket.use-case';
import { TicketRepository } from 'src/modules/tickets/infrastructure/outbound/persistence/repositories/ticket.repository';
import { TicketRepositoryPort } from 'src/modules/tickets/domain/ports/repository/ticket.repository.port';
import { CacheModule } from '../cache/cache.module';
import { CachePort } from 'src/common/ports/cache/cache.ports';
import { CacheService } from '../cache/services/cache.service';
import { NotificationModule } from '../notifications/notification.module';
import { TicketCacheKeyBuilder } from './application/cache/ticket-key-builder.cache';

@Module({
  imports: [CacheModule, NotificationModule],
  controllers: [TicketController],
  providers: [
    CreateTicketUseCase,
    FindAllTicketsUseCase,
    UpdateTicketUseCase,
    TicketCacheKeyBuilder,
    {
      provide: TicketRepositoryPort,
      useClass: TicketRepository,
    },
    {
      provide: CachePort,
      useClass: CacheService,
    },
  ],
})
export class TicketsModule {}
