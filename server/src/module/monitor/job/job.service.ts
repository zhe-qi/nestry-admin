import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isNotEmpty } from 'class-validator';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Response } from 'express';
import { CreateSysJobDto, QueryJobDto, UpdateSysJobDto } from './dto';
import { PrismaService } from '@/module/prisma/prisma.service';
import { exportTable } from '@/common/utils/export';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(private prisma: PrismaService, private scheduler: SchedulerRegistry) {}

  async selectJobList(q: QueryJobDto) {
    const queryCondition: Prisma.SysJobWhereInput = {};
    const conditions = {
      jobName: () => ({ contains: q.jobName }),
      jobGroup: () => ({ contains: q.jobGroup }),
      status: () => ({ equals: q.status }),
    };
    Object.entries(conditions).forEach(([key, value]) => {
      if (isNotEmpty(q[key])) {
        const condition = value();
        if (condition) {
          queryCondition[key] = condition;
        }
      }
    });
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

    return this.prisma.sysJob.create({ data: job });
  }

  async updateJob(job: UpdateSysJobDto) {
    for (const key in job) {
      !isNotEmpty(job[key]) && delete job[key];
    }

    return this.prisma.sysJob.update({
      where: { jobId: job.jobId },
      data: job,
    });
  }

  async deleteJob(jobId: number) {
    return this.prisma.sysJob.delete({ where: { jobId } });
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

  /**
   * Get all cron jobs
   */
  getCrons() {
    const jobs = this.scheduler.getCronJobs();
    jobs.forEach((value, key, _map) => {
      let next: string | Date;
      try {
        const nextDates = value.nextDates();
        if (nextDates.length > 0) {
          next = nextDates[0].toJSDate();
        } else {
          next = 'error: no next dates available';
        }
      } catch {
        next = 'error: next fire date is in the past!';
      }
      this.logger.log(`job: ${key} -> next: ${next}`);
    });
  }

  /**
   * Add a new cron job
   * @param name name of the job
   * @param cronTime cron time
   */
  addCronJob(name: string, cronTime: string) {
    const job = new CronJob(cronTime, () => {
      this.logger.warn(`time (${cronTime}) for job ${name} to run!`);
    });

    this.scheduler.addCronJob(name, job);
    job.start();

    this.logger.warn(`job ${name} added for each minute at ${cronTime} seconds!`);
  }

  /**
   * Delete a cron job
   * @param name name of the job
   */
  deleteCron(name: string) {
    this.scheduler.deleteCronJob(name);
    this.logger.warn(`job ${name} deleted!`);
  }
}
