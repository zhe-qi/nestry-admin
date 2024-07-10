import Redis, { RedisOptions } from 'ioredis';
import { createPool } from 'generic-pool';
import { RedisModuleOptions } from './redis.interfaces';
import { REDIS_MODULE_CONNECTION, REDIS_MODULE_CONNECTION_TOKEN, REDIS_MODULE_OPTIONS_TOKEN } from './redis.constants';

export function getRedisOptionsToken(connection?: string): string {
  return `${connection || REDIS_MODULE_CONNECTION}_${REDIS_MODULE_OPTIONS_TOKEN}`;
}

export function getRedisConnectionToken(connection?: string): string {
  return `${connection || REDIS_MODULE_CONNECTION}_${REDIS_MODULE_CONNECTION_TOKEN}`;
}

export async function createRedisConnection(options: RedisModuleOptions) {
  const { type, options: commonOptions = {} } = options;
  let redis = null;

  switch (type) {
      case 'cluster':
        redis = new Redis.Cluster(options.nodes, commonOptions);
        break;
      case 'single':
        const { url, options: { port, host } = {} } = options;
        const connectionOptions: RedisOptions = { ...commonOptions, port, host };
        redis = url ? new Redis(url, connectionOptions) : new Redis(connectionOptions);
        break;
      default:
        throw new Error('Invalid configuration');
  }

  const pool = createPool({
    create: async () => redis,
    destroy: async (client) => { await client.quit(); },
  }, {
    max: 10, // 最大连接数
    min: 2, // 最小连接数
    // idleTimeoutMillis: 连接在被释放回池之前可以处于空闲状态的最长时间（以毫秒为单位）。
    // 如果连接空闲时间超过此值，则会被自动关闭。这可以防止程序保持不必要的连接开销，从而节省资源。
    idleTimeoutMillis: 300000,

    // acquireTimeoutMillis: 在放弃获取池中连接之前的最长等待时间（以毫秒为单位）。
    // 如果在此时间内没有可用的连接（所有连接都在使用中，并且池已达到最大连接数），则尝试获取连接的请求将会失败。
    // 这可以防止程序在高负载下无限期等待，从而避免潜在的死锁情况。
    acquireTimeoutMillis: 8000,
  });

  const client = await pool.acquire();

  try {
    await client.ping();
  } catch (error) {
    console.error('Redis连接失败: ', error);
  }

  await pool.release(client);

  return client;
}
