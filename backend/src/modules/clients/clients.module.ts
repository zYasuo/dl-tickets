import { Module } from '@nestjs/common';
import { CreateClientUseCase } from 'src/modules/clients/application/use-cases/create-client.use-case';
import { FindAllClientsUseCase } from 'src/modules/clients/application/use-cases/find-all-clients.use-case';
import { FindClientByIdUseCase } from 'src/modules/clients/application/use-cases/find-client-by-id.use-case';
import { ClientController } from 'src/modules/clients/infrastructure/inbound/http/controllers/client.controller';
import { ClientRepository } from 'src/modules/clients/infrastructure/outbound/persistence/repositories/client.repository';
import { CLIENT_REPOSITORY } from './di.tokens';

@Module({
  controllers: [ClientController],
  providers: [
    CreateClientUseCase,
    FindAllClientsUseCase,
    FindClientByIdUseCase,
    {
      provide: CLIENT_REPOSITORY,
      useClass: ClientRepository,
    },
  ],
  exports: [CLIENT_REPOSITORY],
})
export class ClientsModule {}
