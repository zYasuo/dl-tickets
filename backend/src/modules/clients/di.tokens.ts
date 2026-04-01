import type { InjectionToken } from '@nestjs/common';
import type { ClientRepositoryPort } from 'src/modules/clients/domain/ports/repository/client.repository.port';

export const CLIENT_REPOSITORY: InjectionToken<ClientRepositoryPort> = Symbol('CLIENT_REPOSITORY');
