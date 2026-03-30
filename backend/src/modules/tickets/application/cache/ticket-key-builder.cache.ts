import { Inject, Injectable } from '@nestjs/common';
import type { CachePort } from 'src/common/ports/cache/cache.ports';
import { CACHE_PORT } from 'src/di/tokens';
import type { TicketListCriteria } from '../../domain/criteria/ticket-list.criteria';

@Injectable()
export class TicketCacheKeyBuilder {
  private readonly VERSION_KEY = 'tickets:all:version';

  constructor(@Inject(CACHE_PORT) private readonly cache: CachePort) {}

  async buildListKey(criteria: TicketListCriteria): Promise<string> {
    const version = (await this.cache.get(this.VERSION_KEY)) ?? '1';
    const {
      page,
      limit,
      cursor,
      createdFrom,
      createdTo,
      sortBy,
      sortOrder,
      status,
      userUuid,
    } = criteria;

    return `tickets:all:v${version}:user:${userUuid ?? 'none'}:page:${page}:limit:${limit}:cursor:${cursor ?? 'none'}:from:${createdFrom ?? 'none'}:to:${createdTo ?? 'none'}:sort:${sortBy}:${sortOrder}:st:${status ?? 'all'}`;
  }

  async bumpVersion(): Promise<void> {
    await this.cache.incr(this.VERSION_KEY);
  }
}
