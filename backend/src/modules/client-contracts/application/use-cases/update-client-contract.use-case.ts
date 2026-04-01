import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DomainError } from 'src/common/errors/domain.error';
import { Address } from 'src/common/vo/address.vo';
import { ValidateAddressGeoUseCase } from 'src/modules/locations/application/use-cases/validate-address-geo.use-case';
import { CLIENT_CONTRACT_REPOSITORY } from '../../di.tokens';
import type { ClientContractRepositoryPort } from '../../domain/ports/repository/client-contract.repository.port';
import {
  ClientContractEntity,
  ClientContractStatus,
} from '../../domain/entities/client-contract.entity';
import type { UpdateClientContractBody } from '../dto/update-client-contract.dto';

function atStartOfUtcDay(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

@Injectable()
export class UpdateClientContractUseCase {
  constructor(
    @Inject(CLIENT_CONTRACT_REPOSITORY)
    private readonly contractRepository: ClientContractRepositoryPort,
    private readonly validateAddressGeo: ValidateAddressGeoUseCase,
  ) {}

  async execute(id: string, input: UpdateClientContractBody): Promise<ClientContractEntity> {
    const current = await this.contractRepository.findById(id);
    if (!current) {
      throw new NotFoundException('Contract not found');
    }

    const p = current.toParams();

    if (input.status !== undefined) {
      p.status = input.status as ClientContractStatus;
    }

    if (input.endDate !== undefined) {
      p.endDate = input.endDate === null ? undefined : atStartOfUtcDay(input.endDate);
    }

    const useClientAddress = input.useClientAddress ?? p.useClientAddress;
    p.useClientAddress = useClientAddress;

    if (useClientAddress) {
      p.address = undefined;
    } else {
      if (input.address) {
        try {
          const geo = await this.validateAddressGeo.execute(
            input.address.stateUuid,
            input.address.cityUuid,
          );
          p.address = Address.createWithGeo(
            {
              street: input.address.street,
              number: input.address.number,
              complement: input.address.complement,
              neighborhood: input.address.neighborhood,
              zipCode: input.address.zipCode,
            },
            geo,
          );
        } catch (e) {
          if (e instanceof DomainError) {
            throw new BadRequestException(e.message);
          }
          throw e;
        }
      } else if (!p.address) {
        throw new BadRequestException('address is required when useClientAddress is false');
      }
    }

    const next = ClientContractEntity.restore(p);
    try {
      next.validate();
    } catch (e) {
      if (e instanceof DomainError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }

    return this.contractRepository.update(next);
  }
}
