import { Constants } from '@/common/constant/constants';
import { addDateRangeConditions, buildQueryCondition } from '@/common/utils';
import { exportTable } from '@/common/utils/export';
import { PrismaService } from '@/module/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { QueryJobLogDto } from './dto';

@Injectable()
export class JobLogService {
  constructor(private prisma: PrismaService, private scheduler: SchedulerRegistry) {}

  async selectJobList(q: QueryJobLogDto) {
    const conditions = {
      jobName: () => ({ contains: q.jobName }),
      jobGroup: () => ({ contains: q.jobGroup }),
      status: () => ({ equals: q.status }),
    };

    const queryCondition = buildQueryCondition<QueryJobLogDto, Prisma.SysJobLogWhereInput>(q, conditions);

    // 处理日期范围查询条件
    const dateRanges: Record<string, [string, string]> = {
      createTime: ['beginCreateTime', 'endCreateTime'],
      updateTime: ['beginUpdateTime', 'endUpdateTime'],
    };

    // 调用封装的日期范围查询条件处理函数
    addDateRangeConditions(queryCondition, q.params, dateRanges);

    return {
      rows: await this.prisma.sysJobLog.findMany({
        skip: (q.pageNum - 1) * q.pageSize,
        take: q.pageSize,
        where: queryCondition,
      }),
      total: await this.prisma.sysJobLog.count({
        where: queryCondition,
      }),
    };
  }

  async exportJob(res: Response) {
    const title = ['任务日志ID', '任务名称', '任务组名', '调用目标字符串', '任务消息', '状态', '异常信息', '创建时间'];

    const data = (await this.prisma.sysJob.findMany()).map(v =>
      Object.values(v));
    data.unshift(title);
    exportTable(data, res);
  }
}
