import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_PORT } from 'src/modules/cache/di.tokens';
import type { CachePort } from 'src/common/ports/cache/cache.ports';
import { ClientCacheKeyBuilder } from '../cache/client-cache-key-builder';
import { encodeClientDetail, tryDecodeClientDetailCache } from '../mappers/client-cache.codec';
import { CLIENT_REPOSITORY } from '../../di.tokens';
import type { ClientRepositoryPort } from '../../domain/ports/repository/client.repository.port';
import { ClientEntity } from '../../domain/entities/client.entity';

@Injectable()
export class FindClientByIdUseCase {
  private readonly CACHE_TTL_SECONDS = 60 * 10;

  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clientRepository: ClientRepositoryPort,
    @Inject(CACHE_PORT) private readonly cachePort: CachePort,
    private readonly clientCacheKeyBuilder: ClientCacheKeyBuilder,
  ) {}

  async execute(id: string): Promise<ClientEntity> {
    const cacheKey = await this.clientCacheKeyBuilder.buildDetailKey(id);
    const cached = tryDecodeClientDetailCache(await this.cachePort.getJson<unknown>(cacheKey));
    if (cached) {
      return cached;
    }

    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    await this.cachePort.setJson(cacheKey, encodeClientDetail(client), this.CACHE_TTL_SECONDS);
    return client;
  }
}
