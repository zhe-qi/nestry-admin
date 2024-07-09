import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SysConfig } from '@prisma/client';
import { ConfigService } from './service/sys-config.service';
import { CreateSysConfigDto, QuerySysConfigDto, UpdateSysConfigDto } from './dto/index';
import { ParseIntArrayPipe } from '@/common/pipe/parse-int-array.pipe';
import Result from '@/common/utils/result';
import { RequirePermission } from '@/common/decorator/require-premission.decorator';
import { nowDateTime } from '@/common/utils';
import { TableDataInfo } from '@/common/domain/table';

@ApiTags('参数配置')
@ApiBearerAuth()
@Controller('system/config')
export class SysConfigController {
  constructor(private readonly configService: ConfigService) {}

  @ApiOperation({ summary: '查询参数配置列表' })
  @ApiQuery({ type: QuerySysConfigDto })
  @ApiResponse({ type: TableDataInfo<SysConfig> })
  @RequirePermission('system:config:query')
  @Get('/list')
  async listConfig(@Query() q: QuerySysConfigDto) {
    return Result.TableData(await this.configService.selectConfigList(q));
  }

  @ApiOperation({ summary: '导出参数配置xlsx文件' })
  @RequirePermission('system:config:export')
  @Get('/export')
  async export(@Res() res: Response): Promise<void> {
    return this.configService.exportConfig(res);
  }

  @ApiOperation({ summary: '查询参数配置详细' })
  @ApiResponse({ type: Result<SysConfig> })
  @RequirePermission('system:config:query')
  @Get('/:configId')
  async getConfig(@Param('configId', ParseIntPipe) configId: number) {
    return Result.ok(await this.configService.selectConfigByConfigId(configId));
  }

  @ApiOperation({ summary: '新增参数配置' })
  @ApiResponse({ type: Result<SysConfig> })
  @ApiBody({ type: CreateSysConfigDto })
  @RequirePermission('system:config:add')
  @Post('/')
  async addConfig(@Body() sysConfig: CreateSysConfigDto, @Req() req) {
    sysConfig = {
      ...sysConfig,
      createTime: nowDateTime(),
      updateTime: nowDateTime(),
      createBy: req.user?.userName,
      updateBy: req.user?.userName,
    };
    return Result.ok(await this.configService.addConfig(sysConfig));
  }

  @ApiOperation({ summary: '修改参数配置' })
  @ApiResponse({ type: Result<any> })
  @ApiBody({ type: UpdateSysConfigDto })
  @RequirePermission('system:config:edit')
  @Put('/')
  async updateConfig(@Body() sysConfig: UpdateSysConfigDto, @Req() req) {
    sysConfig = {
      ...sysConfig,
      updateTime: nowDateTime(),
      updateBy: req.user?.userName,
    };
    await this.configService.updateConfig(sysConfig);
    return Result.ok('修改成功！');
  }

  @ApiOperation({ summary: '删除参数配置' })
  @ApiResponse({ type: Result<any> })
  @RequirePermission('system:config:remove')
  @Delete('/:ids')
  async delConfig(@Param('ids', ParseIntArrayPipe) configIds: number[]) {
    const { count }
      = await this.configService.deleteConfigByConfigIds(configIds);
    return Result.toAjax(count);
  }
}
