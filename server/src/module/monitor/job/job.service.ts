import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isNotEmpty } from 'class-validator';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Response } from 'express';
import { ChangeSysJobStatusDto, CreateSysJobDto, QueryJobDto, UpdateSysJobDto } from './dto';
import * as TaskHandlers from './taskHandlers';
import { PrismaService } from '@/module/prisma/prisma.service';
import { exportTable } from '@/common/utils/export';
import { buildQueryCondition } from '@/common/utils';
import { Constants } from '@/common/constant/constants';

@Injectable()
export class JobService implements OnModuleInit {
  constructor(private prisma: PrismaService, private scheduler: SchedulerRegistry) {}
  onModuleInit() {
    this.startAllJob();
  }

  // 查找所有状态为1的任务，并启动
  async startAllJob() {
    const jobs = await this.prisma.sysJob.findMany({ where: { status: Constants.SUCCESS } });

    jobs.forEach((job) => {
      try {
        const { invokeTarget, cronExpression } = job;

        const cronJob = new CronJob(cronExpression, TaskHandlers[invokeTarget]);

        this.scheduler.addCronJob(invokeTarget, cronJob);

        cronJob.start();
      } catch (err) {
        console.error(`任务创建失败, ${err}`);
      }
    });
  }

  async selectJobList(q: QueryJobDto) {
    const conditions = {
      jobName: () => ({ contains: q.jobName }),
      jobGroup: () => ({ contains: q.jobGroup }),
      status: () => ({ equals: q.status }),
    };

    const queryCondition = buildQueryCondition<QueryJobDto, Prisma.SysJobWhereInput>(q, conditions);

    return {
      rows: await this.prisma.sysJob.findMany({
        skip: (q.pageNum - 1) * q.pageSize,
        take: q.pageSize,
        where: queryCondition,
      }),
      total: await this.prisma.sysJob.count({
        where: queryCondition,
      }),
    };
  }

  async selectJobByJobId(jobId: number) {
    return this.prisma.sysJob.findUnique({ where: { jobId } });
  }

  async addJob(job: CreateSysJobDto) {
    this.cleanJobData(job);

    await this.executeJobAction(job);

    const res = await this.prisma.sysJob.create({ data: job });

    await this.manageCronJob(res, 'create');

    return res;
  }

  async updateJob(job: UpdateSysJobDto) {
    this.cleanJobData(job);

    await this.executeJobAction(job);

    const res = await this.prisma.sysJob.update({
      where: { jobId: job.jobId },
      data: job,
    });

    await this.manageCronJob(res, 'update');

    return res;
  }

  async deleteJob(jobId: number) {
    const res = await this.prisma.sysJob.delete({ where: { jobId } });

    try {
      const scheduledJob = this.scheduler.getCronJob(res.invokeTarget);

      if (scheduledJob) {
        scheduledJob.stop();
      }

      this.scheduler.deleteCronJob(res.invokeTarget);
    } catch {
      return new BadRequestException('任务已删除，但是定时任务删除时报错');
    }

    return res;
  }

  async exportJob(res: Response) {
    const title = [
      '任务ID',
      '任务名称',
      '任务组名',
      '调用目标字符串',
      'cron执行表达式',
      'misfire策略',
      '是否并发执行',
      '状态',
      '创建时间',
      '更新时间',
      '创建者',
      '更新者',
    ];

    const data = (await this.prisma.sysJob.findMany()).map(v =>
      Object.values(v));
    data.unshift(title);
    exportTable(data, res);
  }

  async changeStatus(job: ChangeSysJobStatusDto) {
    const res = await this.prisma.sysJob.update({
      where: { jobId: job.jobId },
      data: { status: job.status },
    });

    const { invokeTarget, status } = res;

    const scheduledJob = this.scheduler.getCronJob(invokeTarget);

    try {
      if (status === Constants.FAIL) {
        scheduledJob.stop();
      } else {
        scheduledJob.start();
      }
    } catch (err) {
      return new BadRequestException(`任务状态修改失败, ${err}`);
    }

    return res;
  }

  private cleanJobData(job: any): void {
    for (const key in job) {
      if (!isNotEmpty(job[key])) {
        delete job[key];
      }
    }
  }

  private async executeJobAction(job: any): Promise<void> {
    if (job.misfirePolicy === '2') {
      try {
        await this[job.invokeTarget]();
        job.status = Constants.FAIL;
      } catch (error) {
        throw new BadRequestException(`任务执行失败, ${error}`);
      }
    }
  }

  private async manageCronJob(job: any, action: 'create' | 'update'): Promise<void> {
    const { invokeTarget, cronExpression, misfirePolicy, status } = job;

    if (misfirePolicy === '3' || status === Constants.FAIL) {
      return;
    }

    try {
      let cronJob: CronJob<any, any>;

      try {
        cronJob = this.scheduler.getCronJob(invokeTarget);
      } catch {}

      if (action === 'update' && cronJob) {
        cronJob.stop();
        this.scheduler.deleteCronJob(invokeTarget);
      }

      cronJob = new CronJob(cronExpression, TaskHandlers[invokeTarget]);
      this.scheduler.addCronJob(invokeTarget, cronJob);
      cronJob.start();
    } catch (error) {
      throw new BadRequestException(`任务${action === 'create' ? '创建' : '更新'}失败, ${error}`);
    }
  }
}
