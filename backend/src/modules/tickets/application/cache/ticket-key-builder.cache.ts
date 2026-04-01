import { Inject, Injectable } from '@nestjs/common';
import type { CachePort } from 'src/common/ports/cache/cache.ports';
import { CACHE_PORT } from 'src/modules/cache/di.tokens';
import type { TicketListCriteria } from '../../domain/criteria/ticket-list.criteria';

/** Redis key for the list-cache version of a single user (invalidates only that user's list pages). */
export function ticketUserListVersionKey(userUuid: string | undefined): string {
  return `tickets:user:${userUuid ?? 'none'}:version`;
}

@Injectable()
export class TicketCacheKeyBuilder {
  constructor(@Inject(CACHE_PORT) private readonly cache: CachePort) {}

  async buildListKey(criteria: TicketListCriteria): Promise<string> {
    const versionKey = ticketUserListVersionKey(criteria.userUuid);
    const version = (await this.cache.get(versionKey)) ?? '1';
    const { page, limit, cursor, createdFrom, createdTo, sortBy, sortOrder, status, userUuid } =
      criteria;

    return `tickets:all:v${version}:user:${userUuid ?? 'none'}:page:${page}:limit:${limit}:cursor:${cursor ?? 'none'}:from:${createdFrom ?? 'none'}:to:${createdTo ?? 'none'}:sort:${sortBy}:${sortOrder}:st:${status ?? 'all'}`;
  }

  async bumpVersionForUser(userUuid: string): Promise<void> {
    await this.cache.incr(ticketUserListVersionKey(userUuid));
  }
}
