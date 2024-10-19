import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import Redis from 'ioredis';
import { describe, expect, it } from 'vitest';
import { InjectRedis } from './redis.decorators';
import { RedisModule } from './redis.module';
import { getRedisConnectionToken } from './redis.utils';

describe('redisModule', () => {
  it('instance Redis', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule.forRoot({
        type: 'single',
        options: {
          host: '127.0.0.1',
          port: 6379,
          password: '123456',
        },
      })],
    }).compile();

    const app = module.createNestApplication();
    await app.init();
    const redisModule = module.get(RedisModule);
    expect(redisModule).toBeInstanceOf(RedisModule);

    await app.close();
  });

  it('instance Redis client provider', async () => {
    const defaultConnection: string = 'default';

    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule.forRoot({
        type: 'single',
        options: {
          host: '127.0.0.1',
          port: 6379,
          password: '123456',
        },
      })],
    }).compile();

    const app = module.createNestApplication();
    await app.init();
    const redisClient = module.get(getRedisConnectionToken(defaultConnection));
    const redisClientTest = module.get(getRedisConnectionToken(defaultConnection));

    expect(redisClient).toBeInstanceOf(Redis);
    expect(redisClientTest).toBeInstanceOf(Redis);

    await app.close();
  });

  it('inject redis connection', async () => {
    @Injectable()
    class TestProvider {
      constructor(@InjectRedis() private readonly redis: Redis) {}

      getClient() {
        return this.redis;
      }
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule.forRoot({
        type: 'single',
        options: {
          host: '127.0.0.1',
          port: 6379,
          password: '123456',
        },
      })],
      providers: [TestProvider],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    const provider = module.get(TestProvider);
    expect(provider.getClient()).toBeInstanceOf(Redis);

    await app.close();
  });
});
