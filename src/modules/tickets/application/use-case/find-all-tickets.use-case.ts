import { Injectable } from '@nestjs/common';
import { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import type { TFindAllTicket } from '../dto/find-all-ticket.dto';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import { CachePort } from 'src/common/ports/cache/cache.ports';
import { TicketCacheKeyBuilder } from '../cache/ticket-key-buider.cache';
import { buildCacheLockKey, CACHE_LOCK_POLICY } from 'src/common/cache/cache-lock.policy';

@Injectable()
export class FindAllTicketsUseCase {
  private readonly CACHE_TTL_SECONDS = 60 * 10;

  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly cachePort: CachePort,
    private readonly cacheKeyBuilder: TicketCacheKeyBuilder,
  ) {}

  async execute(input: TFindAllTicket): Promise<PaginatedResult<TicketEntity>> {
    const { page, limit, cursor } = input;

    const cacheKey = await this.cacheKeyBuilder.buildListKey(page, limit, cursor);
    const lockKey = buildCacheLockKey(cacheKey);

    const cached = await this.cachePort.getJson<PaginatedResult<TicketEntity>>(cacheKey);

    if (cached) {
      return cached;
    }

    const lockAcquired = await this.cachePort.acquireLock(lockKey, CACHE_LOCK_POLICY.ttlSeconds);

    if (!lockAcquired) {
      const waitedResult = await this.waitForCache<PaginatedResult<TicketEntity>>(cacheKey);
      if (waitedResult) {
        return waitedResult;
      }
    } else {
      try {
        const cachedAfterLock = await this.cachePort.getJson<PaginatedResult<TicketEntity>>(cacheKey);
        if (cachedAfterLock) {
          return cachedAfterLock;
        }

        const result = await this.ticketRepository.findAll({
          page,
          limit,
          cursor,
        });

        await this.cachePort.setJson(cacheKey, result, this.CACHE_TTL_SECONDS);
        return result;
      } finally {
        await this.cachePort.releaseLock(lockKey);
      }
    }

    const result = await this.ticketRepository.findAll({
      page,
      limit,
      cursor,
    });

    await this.cachePort.setJson(cacheKey, result, this.CACHE_TTL_SECONDS);

    return result;
  }

  private async waitForCache<T>(cacheKey: string): Promise<T | null> {
    const deadline = Date.now() + CACHE_LOCK_POLICY.waitMaxMs;

    while (Date.now() < deadline) {
      await this.sleep(CACHE_LOCK_POLICY.waitStepMs);

      const cached = await this.cachePort.getJson<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    return null;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
