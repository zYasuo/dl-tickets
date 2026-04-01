import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import { CACHE_PORT } from 'src/modules/cache/di.tokens';
import { TICKET_REPOSITORY } from '../../di.tokens';
import type { CachePort } from 'src/common/ports/cache/cache.ports';
import { buildCacheLockKey, CACHE_LOCK_POLICY } from 'src/common/cache/cache-lock.policy';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import type { TicketListCriteria } from '../../domain/criteria/ticket-list.criteria';
import type { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { TicketCacheKeyBuilder } from '../cache/ticket-key-builder.cache';
import type { FindAllTicketsQuery } from '../dto/find-all-ticket.dto';
import { encodeTicketListPage, tryDecodeTicketListCache } from '../mappers/ticket-cache.codec';

@Injectable()
export class FindAllTicketsUseCase {
  private readonly CACHE_TTL_SECONDS = 60 * 10;

  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort,
    @Inject(CACHE_PORT) private readonly cachePort: CachePort,
    private readonly cacheKeyBuilder: TicketCacheKeyBuilder,
  ) {}

  async execute(
    input: FindAllTicketsQuery,
    userUuid: string,
  ): Promise<PaginatedResult<TicketEntity>> {
    const criteria = this.toCriteria(input, userUuid);
    const cacheKey = await this.cacheKeyBuilder.buildListKey(criteria);
    const lockKey = buildCacheLockKey(cacheKey);

    const fromCache = tryDecodeTicketListCache(await this.cachePort.getJson<unknown>(cacheKey));
    if (fromCache) {
      return fromCache;
    }

    const lockAcquired = await this.cachePort.acquireLock(lockKey, CACHE_LOCK_POLICY.ttlSeconds);

    if (!lockAcquired) {
      const waitedRaw = await this.waitForCacheRaw(cacheKey);
      const waited = tryDecodeTicketListCache(waitedRaw);
      if (waited) {
        return waited;
      }
    } else {
      try {
        const afterLock = tryDecodeTicketListCache(await this.cachePort.getJson<unknown>(cacheKey));
        if (afterLock) {
          return afterLock;
        }

        const result = await this.ticketRepository.findAll(criteria);

        await this.cachePort.setJson(
          cacheKey,
          encodeTicketListPage(result),
          this.CACHE_TTL_SECONDS,
        );
        return result;
      } finally {
        await this.cachePort.releaseLock(lockKey);
      }
    }

    const result = await this.ticketRepository.findAll(criteria);

    await this.cachePort.setJson(cacheKey, encodeTicketListPage(result), this.CACHE_TTL_SECONDS);

    return result;
  }

  private toCriteria(input: FindAllTicketsQuery, userUuid: string): TicketListCriteria {
    return {
      page: input.page,
      limit: input.limit,
      cursor: input.cursor,
      createdFrom: input.createdFrom,
      createdTo: input.createdTo,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
      status: input.status,
      userUuid,
    };
  }

  private async waitForCacheRaw(cacheKey: string): Promise<unknown> {
    const deadline = Date.now() + CACHE_LOCK_POLICY.waitMaxMs;

    while (Date.now() < deadline) {
      await this.sleep(CACHE_LOCK_POLICY.waitStepMs);

      const cached = await this.cachePort.getJson<unknown>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    return undefined;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
