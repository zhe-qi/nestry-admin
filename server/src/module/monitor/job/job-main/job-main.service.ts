import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, SysJob } from '@prisma/client';
import { isNotEmpty } from 'class-validator';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Response } from 'express';
import { TaskHandlers } from '../taskHandlers';
import { ChangeJobMainStatusDto, CreateJobMainDto, QueryJobMainDto, UpdateJobMainDto } from './dto';
import { PrismaService } from '@/module/prisma/prisma.service';
import { exportTable } from '@/common/utils/export';
import { buildQueryCondition, nowDateTime } from '@/common/utils';
import { Constants } from '@/common/constant/constants';

@Injectable()
export class JobMainService implements OnModuleInit {
  constructor(private prisma: PrismaService, private scheduler: SchedulerRegistry, private taskHandlers: TaskHandlers) {}
  onModuleInit() {
    this.startAllJob();
  }

  // 查找所有状态为1的任务，并启动
  async startAllJob() {
    const jobs = await this.prisma.sysJob.findMany({ where: { status: Constants.SUCCESS } });

    jobs.forEach((job) => {
      try {
        const { invokeTarget, cronExpression } = job;

        if (!getInstanceFunction(this.taskHandlers).includes(invokeTarget)) {
          throw new BadRequestException(`任务${invokeTarget}不存在`);
        }

        const cronJob = new CronJob(cronExpression, () => {
          this.taskHandlers[invokeTarget](job);
        });

        this.scheduler.addCronJob(invokeTarget, cronJob);

        cronJob.start();
      } catch (err) {
        console.error(`任务创建失败, ${err}`);
      }
    });
  }

  async selectJobList(q: QueryJobMainDto) {
    const conditions = {
      jobName: () => ({ contains: q.jobName }),
      jobGroup: () => ({ contains: q.jobGroup }),
      status: () => ({ equals: q.status }),
    };

    const queryCondition = buildQueryCondition<QueryJobMainDto, Prisma.SysJobWhereInput>(q, conditions);

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

  async addJob(job: CreateJobMainDto) {
    this.cleanJobData(job);

    try {
      await this.executeJobAction(job);
      const res = await this.prisma.sysJob.create({ data: job });
      await this.manageCronJob(res, 'create');
      return res;
    } catch (err) {
      throw new BadRequestException(`任务创建失败, ${err}`);
    }
  }

  async updateJob(job: UpdateJobMainDto) {
    this.cleanJobData(job);

    try {
      await this.executeJobAction(job);
      const res = await this.prisma.sysJob.update({
        where: { jobId: job.jobId },
        data: job,
      });
      await this.manageCronJob(res, 'update');
      return res;
    } catch (err) {
      throw new BadRequestException(`任务更新失败, ${err}`);
    }
  }

  async deleteJob(ids: number[]) {
    const jobs = await this.prisma.sysJob.findMany({ where: { jobId: { in: ids } } });

    for (const job of jobs) {
      try {
        const scheduledJob = this.scheduler.getCronJob(job.invokeTarget);
        if (scheduledJob) {
          scheduledJob.stop();
        }
        this.scheduler.deleteCronJob(job.invokeTarget);
      } catch {}
    }

    const res = await this.prisma.sysJob.deleteMany({ where: { jobId: { in: ids } } });

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

  async changeStatus(job: ChangeJobMainStatusDto) {
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

  private async manageCronJob(job: SysJob, action: 'create' | 'update'): Promise<void> {
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

      if (!getInstanceFunction(this.taskHandlers).includes(invokeTarget)) {
        throw new BadRequestException(`任务${invokeTarget}不存在`);
      }

      cronJob = new CronJob(cronExpression, () => {
        this.taskHandlers[invokeTarget](job);
      });
      this.scheduler.addCronJob(invokeTarget, cronJob);
      cronJob.start();
    } catch (error) {
      throw new BadRequestException(`任务${action === 'create' ? '创建' : '更新'}失败, ${error}`);
    }
  }
}

// 获取类上的所有方法，不包含构造函数和原型链上的方法
function getInstanceFunction(instance) {
  const proto = Object.getPrototypeOf(instance);
  const properties = Object.getOwnPropertyNames(proto);
  const methods = properties.filter(prop => typeof instance[prop] === 'function' && prop !== 'constructor' && prop !== 'seedJobLog');
  return methods;
}
