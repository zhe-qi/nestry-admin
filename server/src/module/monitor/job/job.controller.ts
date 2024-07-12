import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SysJob } from '@prisma/client';
import { Response } from 'express';
import { JobService } from './job.service';
import { CreateSysJobDto, QueryJobDto, UpdateSysJobDto } from './dto';
import { RequirePermission } from '@/common/decorator/require-premission.decorator';
import Result from '@/common/utils/result';
import { TableDataInfo } from '@/common/domain/table';
import { nowDateTime } from '@/common/utils';

@ApiTags('定时任务')
@ApiBearerAuth()
@Controller('/monitor/job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @ApiOperation({ summary: '查询定时任务列表' })
  @ApiQuery({ type: QueryJobDto })
  @ApiResponse({ type: TableDataInfo<SysJob> })
  @RequirePermission('monitor:job:query')
  @Get('/list')
  async listRole(@Query() q: QueryJobDto) {
    return Result.TableData(await this.jobService.selectJobList(q));
  }

  @ApiOperation({ summary: '导出定时任务信息表xlsx文件' })
  @RequirePermission('monitor:job:export')
  @Get('/export')
  async export(@Res() res: Response): Promise<void> {
    return this.jobService.exportJob(res);
  }

  @ApiOperation({ summary: '查询定时任务详细' })
  @ApiResponse({ type: Result<SysJob> })
  @RequirePermission('monitor:job:query')
  @Get('/:jobId')
  async getRole(@Param('jobId') jobId: number) {
    return Result.ok(await this.jobService.selectJobByJobId(jobId));
  }

  @ApiOperation({ summary: '新增定时任务' })
  @ApiBody({ type: CreateSysJobDto })
  @ApiResponse({ type: Result<SysJob> })
  @RequirePermission('monitor:job:add')
  @Post('/')
  async addRole(@Body() job: CreateSysJobDto, @Req() req) {
    return Result.ok(await this.jobService.addJob({
      ...job,
      createTime: nowDateTime(),
      updateTime: nowDateTime(),
      createBy: req.user?.userName,
      updateBy: req.user?.userName,
    }));
  }

  @ApiOperation({ summary: '修改定时任务' })
  @ApiBody({ type: UpdateSysJobDto })
  @ApiResponse({ type: Result<SysJob> })
  @RequirePermission('monitor:job:edit')
  @Put('/')
  async editRole(@Body() job: UpdateSysJobDto, @Req() req) {
    return Result.ok(await this.jobService.updateJob({
      ...job,
      updateTime: nowDateTime(),
      updateBy: req.user?.userName,
    }));
  }

  @ApiOperation({ summary: '删除定时任务' })
  @ApiResponse({ type: Result<any> })
  @RequirePermission('monitor:job:remove')
  @Delete('/:jobId')
  async removeRole(@Param('jobId') jobId: number) {
    return Result.ok(await this.jobService.deleteJob(jobId));
  }
}
