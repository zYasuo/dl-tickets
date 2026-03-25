jest.mock('ioredis', () => {
  const Redis = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    incr: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
  }));
  return { Redis };
});

import { Test } from '@nestjs/testing';
import { Redis } from 'ioredis';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let redisInstance: {
    get: jest.Mock;
    set: jest.Mock;
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();
    service = moduleRef.get(CacheService);
    redisInstance = (Redis as unknown as jest.Mock).mock.results.at(-1)!.value;
  });

  it('prefixes keys for get/set', async () => {
    redisInstance.get.mockResolvedValueOnce('hello');

    const v = await service.get('k');
    expect(v).toBe('hello');
    expect(redisInstance.get).toHaveBeenCalledWith('cache:k');

    await service.set('k2', 'v', 10);
    expect(redisInstance.set).toHaveBeenCalledWith('cache:k2', 'v', 'EX', 10);
  });

  it('getJson returns null for invalid JSON', async () => {
    redisInstance.get.mockResolvedValueOnce('{');

    await expect(service.getJson<{ a: number }>('bad')).resolves.toBeNull();
  });

  it('acquireLock uses SET NX', async () => {
    redisInstance.set.mockResolvedValueOnce('OK');
    await expect(service.acquireLock('L', 5)).resolves.toBe(true);
    expect(redisInstance.set).toHaveBeenCalledWith('cache:L', '1', 'EX', 5, 'NX');

    redisInstance.set.mockResolvedValueOnce(null);
    await expect(service.acquireLock('L2', 3)).resolves.toBe(false);
  });
});
