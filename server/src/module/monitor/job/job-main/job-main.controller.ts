import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SysJob } from '@prisma/client';
import { Response } from 'express';
import { ChangeJobMainStatusDto, CreateJobMainDto, QueryJobMainDto, UpdateJobMainDto } from './dto';
import { JobMainService } from './job-main.service';
import { RequirePermission } from '@/common/decorator/require-premission.decorator';
import Result from '@/common/utils/result';
import { TableDataInfo } from '@/common/domain/table';
import { nowDateTime } from '@/common/utils';
import { ParseIntArrayPipe } from '@/common/pipe/parse-int-array.pipe';

@ApiTags('定时任务')
@ApiBearerAuth()
@Controller('/monitor/job')
export class JobMainController {
  constructor(private readonly jobMainService: JobMainService) {}

  @ApiOperation({ summary: '查询定时任务列表' })
  @ApiQuery({ type: QueryJobMainDto })
  @ApiResponse({ type: TableDataInfo<SysJob> })
  @RequirePermission('monitor:job:query')
  @Get('/list')
  async listRole(@Query() q: QueryJobMainDto) {
    return Result.TableData(await this.jobMainService.selectJobList(q));
  }

  @ApiOperation({ summary: '导出定时任务信息表xlsx文件' })
  @RequirePermission('monitor:job:export')
  @Get('/export')
  async export(@Res() res: Response): Promise<void> {
    return this.jobMainService.exportJob(res);
  }

  @ApiOperation({ summary: '查询定时任务详细' })
  @ApiResponse({ type: Result<SysJob> })
  @RequirePermission('monitor:job:query')
  @Get('/:jobId')
  async getRole(@Param('jobId') jobId: number) {
    return Result.ok(await this.jobMainService.selectJobByJobId(jobId));
  }

  @ApiOperation({ summary: '新增定时任务' })
  @ApiBody({ type: CreateJobMainDto })
  @ApiResponse({ type: Result<SysJob> })
  @RequirePermission('monitor:job:add')
  @Post('/')
  async addRole(@Body() job: CreateJobMainDto, @Req() req) {
    return Result.ok(await this.jobMainService.addJob({
      ...job,
      createTime: nowDateTime(),
      updateTime: nowDateTime(),
      createBy: req.user?.userName,
      updateBy: req.user?.userName,
    }));
  }

  @ApiOperation({ summary: '修改定时任务' })
  @ApiBody({ type: UpdateJobMainDto })
  @ApiResponse({ type: Result<SysJob> })
  @RequirePermission('monitor:job:edit')
  @Put('/')
  async editRole(@Body() job: UpdateJobMainDto, @Req() req) {
    return Result.ok(await this.jobMainService.updateJob({
      ...job,
      updateTime: nowDateTime(),
      updateBy: req.user?.userName,
    }));
  }

  @ApiOperation({ summary: '删除定时任务' })
  @ApiResponse({ type: Result<any> })
  @RequirePermission('monitor:job:remove')
  @Delete('/:ids')
  async removeRole(@Param('ids', ParseIntArrayPipe) ids: number[]) {
    return Result.ok(await this.jobMainService.deleteJob(ids));
  }

  @ApiOperation({ summary: '修改定时任务状态' })
  @ApiResponse({ type: Result<any> })
  @RequirePermission('monitor:job:edit')
  @Put('/changeStatus')
  async changeStatus(@Body() job: ChangeJobMainStatusDto) {
    return Result.ok(await this.jobMainService.changeStatus(job));
  }
}
