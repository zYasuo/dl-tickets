import { Module } from '@nestjs/common';
import { ClientsModule } from 'src/modules/clients/clients.module';
import { LocationsModule } from 'src/modules/locations/locations.module';
import { CreateClientContractUseCase } from './application/use-cases/create-client-contract.use-case';
import { FindAllClientContractsUseCase } from './application/use-cases/find-all-client-contracts.use-case';
import { FindClientContractByIdUseCase } from './application/use-cases/find-client-contract-by-id.use-case';
import { UpdateClientContractUseCase } from './application/use-cases/update-client-contract.use-case';
import { ClientContractController } from './infrastructure/inbound/http/controllers/client-contract.controller';
import { ClientContractRepository } from './infrastructure/outbound/persistence/repositories/client-contract.repository';
import { CLIENT_CONTRACT_REPOSITORY } from './di.tokens';

@Module({
  imports: [ClientsModule, LocationsModule],
  controllers: [ClientContractController],
  providers: [
    CreateClientContractUseCase,
    FindAllClientContractsUseCase,
    FindClientContractByIdUseCase,
    UpdateClientContractUseCase,
    {
      provide: CLIENT_CONTRACT_REPOSITORY,
      useClass: ClientContractRepository,
    },
  ],
  exports: [CLIENT_CONTRACT_REPOSITORY],
})
export class ClientContractsModule {}
