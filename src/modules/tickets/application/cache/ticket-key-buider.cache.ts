import { Injectable } from '@nestjs/common';
import { CachePort } from 'src/common/ports/cache/cache.ports';

@Injectable()
export class TicketCacheKeyBuilder {
  private readonly VERSION_KEY = 'tickets:all:version';

  constructor(private readonly cache: CachePort) {}

  async buildListKey(page: number, limit: number, cursor?: string): Promise<string> {
    const version = (await this.cache.get(this.VERSION_KEY)) ?? '1';

    return `tickets:all:v${version}:page:${page}:limit:${limit}:cursor:${cursor ?? 'none'}`;
  }

  async bumpVersion(): Promise<void> {
    await this.cache.incr(this.VERSION_KEY);
  }
}
