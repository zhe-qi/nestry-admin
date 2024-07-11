import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import Result from '@/common/utils/result';
import { getServerInfo } from '@/common/utils/systemInfo';

@ApiTags('系统监控')
@ApiBearerAuth()
@Controller('/monitor/server')
export class ServerController {
  constructor() {}

  @ApiOperation({ summary: '获取服务器信息' })
  @Get()
  async getInfo() {
    return Result.ok(await getServerInfo());
  }
}
