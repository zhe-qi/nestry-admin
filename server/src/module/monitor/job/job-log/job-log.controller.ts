import { RequirePermission } from '@/common/decorator/require-premission.decorator';
import { TableDataInfo } from '@/common/domain/table';
import { ParseIntArrayPipe } from '@/common/pipe/parse-int-array.pipe';
import { nowDateTime } from '@/common/utils';
import Result from '@/common/utils/result';
import { PrismaService } from '@/module/prisma/prisma.service';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SysJobLog } from '@prisma/client';
import { Response } from 'express';
import { QueryJobLogDto } from './dto';
import { JobLogService } from './job-log.service';

@ApiTags('定时任务日志')
@ApiBearerAuth()
@Controller('/monitor/jobLog')
export class JobLogController {
  constructor(private jobLogService: JobLogService, private prisma: PrismaService) {}

  @ApiOperation({ summary: '查询定时任务日志列表' })
  @ApiQuery({ type: QueryJobLogDto })
  @ApiResponse({ type: TableDataInfo<SysJobLog> })
  @RequirePermission('monitor:job:query')
  @Get('/list')
  async listRole(@Query() q: QueryJobLogDto) {
    return Result.TableData(await this.jobLogService.selectJobList(q));
  }

  @ApiOperation({ summary: '导出定时任务日志信息表xlsx文件' })
  @RequirePermission('monitor:job:export')
  @Get('/export')
  async export(@Res() res: Response): Promise<void> {
    return this.jobLogService.exportJob(res);
  }

  @ApiOperation({ summary: '清空定时任务日志' })
  @ApiResponse({ type: Result })
  @RequirePermission('monitor:job:remove')
  @Delete('/clean')
  async clean() {
    return Result.ok(await this.prisma.sysJobLog.deleteMany({ where: {} }));
  }

  @ApiOperation({ summary: '删除定时任务日志' })
  @ApiResponse({ type: Result })
  @RequirePermission('monitor:job:remove')
  @Delete('/:ids')
  async remove(@Param('ids', ParseIntArrayPipe) ids: number[]) {
    return Result.ok(await this.prisma.sysJobLog.deleteMany({ where: { jobLogId: { in: ids } } }));
  }
}
