import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { InjectRedis } from './redis.decorators';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  /* 获取信息 */
  async getRedisInfo() {
    try {
      // 获取 Redis INFO
      const info = await this.redis.info();
      // 获取 Redis DBSIZE
      const dbSize = await this.redis.dbsize();
      // 获取 Redis COMMANDSTATS
      const commandStats = await this.redis.call('info', 'commandstats');

      // 解析 INFO
      const parsedInfo = parseRedisInfo(info);
      // 解析 COMMANDSTATS
      const parsedCommandStats = parseCommandStats(commandStats);
      return {
        commandStats: parsedCommandStats,
        info: parsedInfo,
        dbSize,
      };
    } catch (err) {
      console.error('Error fetching Redis info:', err);
    }
  }

  /* 分页查询 */
  async skipFind(data: { key: string, pageSize: number, pageNum: number }) {
    const rawInfo = await this.redis.lrange(data.key, (data.pageNum - 1) * data.pageSize, data.pageNum * data.pageSize);
    return rawInfo;
  }

  /* --------------------- string 相关 -------------------------- */

  /* 插入操作 */
  async set(key: string, value: string, expire?: number): Promise<string> {
    if (expire) {
      return await this.redis.set(
        key,
        value,
        'EX',
        expire,
      );
    } else {
      return await this.redis.set(key, value);
    }
  }

  /* 批量获取操作 */
  async mget(keys: string[]): Promise<(string | null)[]> {
    return this.redis.mget(keys);
  }

  /* 获取操作 */
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  /* 删除操作 */
  async del(keys: string | string[]): Promise<number> {
    if (typeof keys === 'string') { keys = [keys]; }
    return await this.redis.del(...keys);
  }

  /* 设置过期时间 */
  async ttl(key: string): Promise<number | null> {
    return this.redis.ttl(key);
  }

  /* 获取所有 key */
  async keys(key?: string) {
    return await this.redis.keys(key);
  }

  /* --------------------- hash 相关 -------------------------- */

  /* 哈希表插入操作 */
  async hset(key: string, field: string, value: string): Promise<string | number | null> {
    return this.redis.hset(key, field, value);
  }

  /* 哈希表批量插入操作 */
  async hmset(key: string, data: Record<string, string | number | boolean>, expire?: number): Promise<number | any> {
    const result = await this.redis.hmset(key, data);
    if (expire) {
      await this.redis.expire(key, expire);
    }
    return result;
  }

  /* 哈希表获取操作 */
  async hget(key: string, field: string): Promise<number | string | null> {
    return this.redis.hget(key, field);
  }

  /* 哈希表批量获取操作 */
  async hvals(key: string): Promise<string[]> {
    return this.redis.hvals(key);
  }

  /* 哈希表获取全部操作 */
  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redis.hgetall(key);
  }

  /* 哈希表删除操作 */
  async hdel(key: string, fields: string | string[]): Promise<string[] | number> {
    return this.redis.hdel(key, ...fields);
  }

  /* 哈希表删除全部操作 */
  async hdels(key: string): Promise<string[] | number> {
    if (!key) { return 0; }
    const fields = await this.hvals(key);
    if (fields.length === 0) { return 0; }
    return await this.hdel(key, fields);
  }

  /* -----------   list 相关操作 ------------------ */

  /* 获取列表长度 */
  async llen(key: string): Promise<number> {
    return this.redis.llen(key);
  }

  /* 通过索引设置列表元素的值 */
  async lset(key: string, index: number, val: string): Promise<'OK' | null> {
    return this.redis.lset(key, index, val);
  }

  /* 通过索引获取列表中的元素 */
  async lindex(key: string, index: number): Promise<string | null> {
    return this.redis.lindex(key, index);
  }

  /* 获取列表指定范围内的元素 */
  async lrange(key: string, start: number, stop: number): Promise<string[] | null> {
    return this.redis.lrange(key, start, stop);
  }

  /* 将一个或多个值插入到列表头部 */
  async lpush(key: string, ...val: string[]): Promise<number> {
    return this.redis.lpush(key, ...val);
  }

  /* 将一个值或多个值插入到已存在的列表头部 */
  async lpushx(key: string, ...val: string[]): Promise<number> {
    return this.redis.lpushx(key, ...val);
  }

  /* 如果 pivot 存在，则在 pivot 前面添加值 */
  async linsertL(key: string, pivot: string, val: string): Promise<number> {
    return this.redis.linsert(
      key,
      'BEFORE',
      pivot,
      val,
    );
  }

  /* 如果 pivot 存在，则在 pivot 后面添加值 */
  async linsertR(key: string, pivot: string, val: string): Promise<number> {
    return this.redis.linsert(
      key,
      'AFTER',
      pivot,
      val,
    );
  }

  /* 在列表中添加一个或多个值 */
  async rpush(key: string, ...val: string[]): Promise<number> {
    return this.redis.rpush(key, ...val);
  }

  /* 为已存在的列表添加一个或多个值 */
  async rpushx(key: string, ...val: string[]): Promise<number> {
    return this.redis.rpushx(key, ...val);
  }

  /* 移除并获取列表第一个元素 */
  async blpop(key: string): Promise<string> {
    const result = await this.redis.blpop(key);
    return result.length > 0 ? result[0] : null;
  }

  /* 移除并获取列表最后一个元素 */
  async brpop(key: string): Promise<string> {
    const result = await this.redis.brpop(key);
    return result.length > 0 ? result[0] : null;
  }

  /* 对一个列表进行修剪(trim)，就是说，让列表只保留指定区间内的元素，不在指定区间之内的元素都将被删除 */
  async ltrim(key: string, start: number, stop: number): Promise<'OK' | null> {
    return this.redis.ltrim(key, start, stop);
  }

  /* 移除列表元素 */
  async lrem(key: string, count: number, val: string): Promise<number> {
    return this.redis.lrem(key, count, val);
  }

  /* 移除并获取列表的第一个元素 */
  async brpoplpush(sourceKey: string, destinationKey: string, timeout: number): Promise<string> {
    return this.redis.brpoplpush(sourceKey, destinationKey, timeout);
  }

  /* 自增操作 */
  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  /* 自减操作 */
  async decr(key: string): Promise<number> {
    return this.redis.decr(key);
  }

  /* 左弹出操作 */
  async lpop(key: string): Promise<string | null> {
    return this.redis.lpop(key);
  }

  /* 右弹出操作 */
  async rpop(key: string): Promise<string | null> {
    return this.redis.rpop(key);
  }

  /* 扫描操作 */
  async scanStream(match: string): Promise<string[]> {
    const stream = this.redis.scanStream({ match, count: 200 });
    const keys: string[] = [];

    return new Promise<string[]>((resolve, reject) => {
      stream.on('data', (resultKeys: string[]) => {
        keys.push(...resultKeys);
      });

      stream.on('end', () => resolve(keys));
      stream.on('error', (err: Error) => reject(err));
    });
  }

  /* 删除全部缓存 */
  async reset() {
    return this.redis.reset();
  }
}

function parseCommandStats(commandStats) {
  const lines = commandStats.split('\r\n');
  const result = [];
  lines.forEach((line) => {
    if (line && line.startsWith('cmdstat_')) {
      const parts = line.split(':');
      if (parts.length === 2) {
        const name = parts[0].substring(8);
        const values = parts[1].split(',');
        const valueObj: any = {};
        values.forEach((value) => {
          const [key, val] = value.split('=');
          valueObj[key] = val;
        });
        result.push({ name, value: valueObj?.calls || '0' });
      }
    }
  });
  return result;
}

function parseRedisInfo(info) {
  const lines = info.split('\r\n');
  const result = {};
  lines.forEach((line) => {
    if (line && line[0] !== '#') {
      const parts = line.split(':');
      if (parts.length === 2) {
        result[parts[0]] = parts[1];
      }
    }
  });
  return result;
}
