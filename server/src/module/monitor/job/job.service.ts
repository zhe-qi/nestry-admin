import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isNotEmpty } from 'class-validator';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Response } from 'express';
import { ChangeSysJobStatusDto, CreateSysJobDto, QueryJobDto, UpdateSysJobDto } from './dto';
import { PrismaService } from '@/module/prisma/prisma.service';
import { exportTable } from '@/common/utils/export';
import { buildQueryCondition } from '@/common/utils';

@Injectable()
export class JobService implements OnModuleInit {
  constructor(private prisma: PrismaService, private scheduler: SchedulerRegistry) {}
  onModuleInit() {
    this.startAllJob();
  }

  // 查找所有状态为1的任务，并启动
  async startAllJob() {
    const jobs = await this.prisma.sysJob.findMany({ where: { status: '0' } });

    jobs.forEach((job) => {
      try {
        const { invokeTarget, cronExpression } = job;

        const cronJob = new CronJob(cronExpression, this[invokeTarget]);

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
    for (const key in job) {
      !isNotEmpty(job[key]) && delete job[key];
    }

    if (job.misfirePolicy === '2') {
      try {
        this[job.invokeTarget]();
      } catch (error) {
        return new BadRequestException(`任务执行失败, ${error}`);
      }

      job.status = '1';

      const res = await this.prisma.sysJob.create({ data: job });

      return res;
    }

    const res = await this.prisma.sysJob.create({ data: job });

    const { invokeTarget, status, cronExpression, misfirePolicy } = res;

    if (misfirePolicy === '3' || status === '1') { return res; }

    try {
      const cronJob = new CronJob(cronExpression, this[invokeTarget]);

      this.scheduler.addCronJob(invokeTarget, cronJob);

      cronJob.start();
    } catch (err) {
      return new BadRequestException(`任务创建失败, ${err}`);
    }

    return res;
  }

  async updateJob(job: UpdateSysJobDto) {
    for (const key in job) {
      !isNotEmpty(job[key]) && delete job[key];
    }

    if (job.misfirePolicy === '2') {
      try {
        this[job.invokeTarget]();
      } catch (error) {
        return new BadRequestException(`任务执行失败, ${error}`);
      }

      job.status = '1';

      const res = await this.prisma.sysJob.update({
        where: { jobId: job.jobId },
        data: job,
      });

      return res;
    }

    const res = await this.prisma.sysJob.update({
      where: { jobId: job.jobId },
      data: job,
    });

    const { invokeTarget, status, cronExpression, misfirePolicy } = res;

    const scheduledJob = this.scheduler.getCronJob(invokeTarget);

    if (scheduledJob) {
      scheduledJob.stop();
    }

    this.scheduler.deleteCronJob(invokeTarget);

    if (misfirePolicy === '3' || status === '1') { return res; }

    const cronJob = new CronJob(cronExpression, this[invokeTarget]);

    this.scheduler.addCronJob(invokeTarget, cronJob);

    cronJob.start();

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

    if (status === '1') {
      scheduledJob.stop();
    } else {
      scheduledJob.start();
    }

    return res;
  }

  async testJob() {
    // eslint-disable-next-line no-console
    console.log('testJob');
  }
}
