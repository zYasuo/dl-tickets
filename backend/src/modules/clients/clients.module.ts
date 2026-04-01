import { Module } from '@nestjs/common';
import { ClientCacheKeyBuilder } from 'src/modules/clients/application/cache/client-cache-key-builder';
import { CreateClientUseCase } from 'src/modules/clients/application/use-cases/create-client.use-case';
import { FindAllClientsUseCase } from 'src/modules/clients/application/use-cases/find-all-clients.use-case';
import { FindClientByIdUseCase } from 'src/modules/clients/application/use-cases/find-client-by-id.use-case';
import { SearchClientsUseCase } from 'src/modules/clients/application/use-cases/search-clients.use-case';
import { ClientController } from 'src/modules/clients/infrastructure/inbound/http/controllers/client.controller';
import { ClientRepository } from 'src/modules/clients/infrastructure/outbound/persistence/repositories/client.repository';
import { CacheModule } from '../cache/cache.module';
import { LocationsModule } from '../locations/locations.module';
import { CLIENT_REPOSITORY } from './di.tokens';

@Module({
  imports: [CacheModule, LocationsModule],
  controllers: [ClientController],
  providers: [
    ClientCacheKeyBuilder,
    CreateClientUseCase,
    FindAllClientsUseCase,
    FindClientByIdUseCase,
    SearchClientsUseCase,
    {
      provide: CLIENT_REPOSITORY,
      useClass: ClientRepository,
    },
  ],
  exports: [CLIENT_REPOSITORY],
})
export class ClientsModule {}
