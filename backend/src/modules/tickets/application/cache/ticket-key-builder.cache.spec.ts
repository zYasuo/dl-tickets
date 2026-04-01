import { randomUUID } from 'node:crypto';
import type { CachePort } from 'src/common/ports/cache/cache.ports';
import type { TicketListCriteria } from '../../domain/criteria/ticket-list.criteria';
import { TicketCacheKeyBuilder, ticketUserListVersionKey } from './ticket-key-builder.cache';

describe('TicketCacheKeyBuilder', () => {
  let cache: jest.Mocked<Pick<CachePort, 'get' | 'incr'>>;
  let builder: TicketCacheKeyBuilder;

  const userUuid = randomUUID();

  const baseCriteria = (): TicketListCriteria => ({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    userUuid,
  });

  beforeEach(() => {
    cache = {
      get: jest.fn(),
      incr: jest.fn(),
    };
    builder = new TicketCacheKeyBuilder(cache as unknown as CachePort);
  });

  it('buildListKey reads version from per-user Redis key', async () => {
    const versionKey = ticketUserListVersionKey(userUuid);
    cache.get.mockResolvedValueOnce('3');

    const key = await builder.buildListKey(baseCriteria());

    expect(cache.get).toHaveBeenCalledWith(versionKey);
    expect(key).toContain(':v3:');
    expect(key).toContain(`user:${userUuid}`);
  });

  it('buildListKey defaults version to 1 when key missing', async () => {
    cache.get.mockResolvedValueOnce(null);

    const key = await builder.buildListKey(baseCriteria());

    expect(key).toContain(':v1:');
  });

  it('bumpVersionForUser increments per-user version key', async () => {
    await builder.bumpVersionForUser(userUuid);

    expect(cache.incr).toHaveBeenCalledWith(ticketUserListVersionKey(userUuid));
  });
});
