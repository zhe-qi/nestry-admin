import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SysLogininfor } from '@prisma/client';
import { LogininforService } from './logininfor.service';
import { CreateSysLogininforDto, QuerySysLogininforDto, UpdateSysLogininforDto } from './dto/index';
import { ParseIntArrayPipe } from '@/common/pipe/parse-int-array.pipe';
import Result from '@/common/utils/result';
import { RequirePermission } from '@/common/decorator/require-premission.decorator';
import { TableDataInfo } from '@/common/domain/table';

@ApiTags('登录日志')
@ApiBearerAuth()
@Controller('monitor/logininfor')
export class LogininforController {
  constructor(private logininforService: LogininforService) {}
  @ApiOperation({ summary: '查询登录日志列表' })
  @ApiQuery({ type: QuerySysLogininforDto })
  @ApiResponse({ type: TableDataInfo<SysLogininfor> })
  @RequirePermission('monitor:logininfor:query')
  @Get('/list')
  async listLogininfor(@Query() q: QuerySysLogininforDto) {
    return Result.TableData(await this.logininforService.selectLogininforList(q));
  }

  @ApiOperation({ summary: '清空登录日志' })
  @Delete('/clean')
  async clearInfo() {
    await this.logininforService.clear();
    return Result.ok();
  }

  @ApiOperation({ summary: '导出登录日志xlsx文件' })
  @RequirePermission('monitor:logininfor:export')
  @Get('/export')
  async export(@Res() res: Response) {
    return this.logininforService.exportLogininfor(res);
  }

  @ApiOperation({ summary: '查询登录日志详细' })
  @ApiResponse({ type: Result<SysLogininfor> })
  @RequirePermission('monitor:logininfor:query')
  @Get('/:infoId')
  async getLogininfor(@Param('infoId', ParseIntPipe) infoId: number) {
    return Result.ok(await this.logininforService.selectLogininforByInfoId(infoId));
  }

  @ApiOperation({ summary: '新增登录日志' })
  @ApiResponse({ type: Result<SysLogininfor> })
  @ApiBody({ type: CreateSysLogininforDto })
  @RequirePermission('monitor:logininfor:add')
  @Post('/')
  async addLogininfor(@Body() sysLogininfor: CreateSysLogininforDto) {
    return Result.ok(await this.logininforService.addLogininfor(sysLogininfor));
  }

  @ApiOperation({ summary: '修改登录日志' })
  @ApiResponse({ type: Result<any> })
  @ApiBody({ type: UpdateSysLogininforDto })
  @RequirePermission('monitor:logininfor:edit')
  @Put('/')
  async updateLogininfor(@Body() sysLogininfor: UpdateSysLogininforDto) {
    await this.logininforService.updateLogininfor(sysLogininfor);
    return Result.ok('修改成功！');
  }

  @ApiOperation({ summary: '删除登录日志' })
  @ApiResponse({ type: Result<any> })
  @RequirePermission('monitor:logininfor:remove')
  @Delete('/:ids')
  async delLogininfor(@Param('ids', ParseIntArrayPipe) infoIds: number[]) {
    const { count }
      = await this.logininforService.deleteLogininforByInfoIds(infoIds);
    return Result.toAjax(count);
  }
}
