import { Inject } from '@nestjs/common';
import { getRedisConnectionToken } from './redis.utils';

export function InjectRedis(connection?: string) {
  return Inject(getRedisConnectionToken(connection));
}
