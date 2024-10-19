import Result from '@/common/utils/result';
import { RedisService } from '@/module/redis/redis.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  private readonly caches = [
    {
      cacheName: 'login_tokens:',
      cacheKey: '',
      cacheValue: '',
      remark: '用户信息',
    },
    {
      cacheName: 'sys_config:',
      cacheKey: '',
      cacheValue: '',
      remark: '配置信息',
    },
    {
      cacheName: 'sys_dict:',
      cacheKey: '',
      cacheValue: '',
      remark: '数据字典',
    },
    {
      cacheName: 'captcha_codes:',
      cacheKey: '',
      cacheValue: '',
      remark: '验证码',
    },
    {
      cacheName: 'repeat_submit:',
      cacheKey: '',
      cacheValue: '',
      remark: '防重提交',
    },
    {
      cacheName: 'rate_limit:',
      cacheKey: '',
      cacheValue: '',
      remark: '限流处理',
    },
    {
      cacheName: 'pwd_err_cnt:',
      cacheKey: '',
      cacheValue: '',
      remark: '密码错误次数',
    },
  ];

  async getNames() {
    return Result.ok(this.caches);
  }

  async getKeys(id: string) {
    const data = await this.redis.keys(`${id}*`);
    return Result.ok(data);
  }

  async clearCacheKey(id: string) {
    const data = await this.redis.del(id);
    return Result.ok(data);
  }

  async clearCacheName(id: string) {
    const keys = await this.redis.keys(`${id}*`);
    const data = await this.redis.del(keys);
    return Result.ok(data);
  }

  async clearCacheAll() {
    const data = await this.redis.reset();
    return Result.ok(data);
  }

  async getValue(params) {
    const list = JSON.parse(JSON.stringify(this.caches));
    const data = list.find(item => item.cacheName === params.cacheName);
    const cacheValue = await this.redis.get(params.cacheKey);
    data.cacheValue = JSON.stringify(cacheValue);
    data.cacheKey = params.cacheKey;
    return Result.ok(data);
  }

  /** 缓存监控 */
  async getInfo() {
    return Result.ok(await this.redis.getRedisInfo());
  }
}
