import { Controller, Delete, Get, Param, ParseArrayPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Constants } from '@/common/constant/constants';
import Result from '@/common/utils/result';
import { RequirePermission } from '@/common/decorator/require-premission.decorator';
import { RedisService } from '@/module/redis/redis.service';

@ApiTags('系统监控')
@ApiBearerAuth()
@Controller('/monitor/online')
export class OnlineController {
  constructor(private readonly redis: RedisService) {}

  @ApiOperation({ summary: '获取在线用户信息' })
  @Throttle({
    default: {
      limit: 20,
      ttl: 1000 * 60,
    },
  })
  @RequirePermission('monitor:online:query')
  @Get('/list')
  async getOnlineList(@Query() { ipaddr = '', userName = '' }) {
    const tokens = await this.redis.scanStream(`${Constants.LOGIN_TOKEN_KEY}*`);
    if (!tokens.length) {
      return Result.TableData({
        rows: [],
        total: 0,
      });
    }
    let userList = (await this.redis.mget(tokens)).map(v => JSON.parse(v));
    userList = userList.filter(v => v.loginLocation.includes(ipaddr) && v.userName.includes(userName));
    userList.sort((a, b) => +new Date(b.loginTime) - +new Date(a.loginTime));
    return Result.TableData({
      rows: userList,
      total: userList.length,
    });
  }

  @ApiOperation({ summary: '强退用户' })
  @Throttle({
    default: {
      limit: 20,
      ttl: 1000 * 60,
    },
  })
  @RequirePermission('monitor:online:batchLogout')
  @Delete('/:tokenId')
  async forceLogout(@Param('tokenId', ParseArrayPipe) tokenIds: string[]) {
    for (const tokenId of tokenIds) {
      const user = JSON.parse((await this.redis.get(Constants.LOGIN_TOKEN_KEY + tokenId)) || null);
      if (user) {
        // 不可强退超级管理员
        if (user.userId === 1) { return Result.Error('不可强退超级管理员！'); }
        await this.redis.del(Constants.LOGIN_TOKEN_KEY + tokenId);
      }
    }
    return Result.ok('操作成功！');
  }
}
