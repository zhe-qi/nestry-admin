import { SysJob } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/module/prisma/prisma.service';
import { nowDateTime } from '@/common/utils';
import { Constants } from '@/common/constant/constants';

/**
 * 请勿在这个类中定义任何危险函数，这些函数可能会被恶意用户利用，或者选择开启白名单模式
 */
@Injectable()
export class TaskHandlers {
  constructor(private prisma: PrismaService) {}

  /**
   * seedJobLog在黑名单当中，不会加入外部执行函数
   */
  seedJobLog(
    job: SysJob,
    status: '0' | '1',
    jobMessage: string = '',
    exceptionInfo: string = '',
  ) {
    this.prisma.sysJobLog.create({
      data: {
        jobName: job.jobName,
        jobGroup: job.jobGroup,
        invokeTarget: job.invokeTarget,
        exceptionInfo,
        jobMessage,
        status,
        createTime: nowDateTime(),
      },
    }).then(() => {});
  }

  testJob(job: SysJob) {
    // eslint-disable-next-line no-console
    console.log('testJob');
    this.seedJobLog(job, Constants.SUCCESS, '测试任务成功');
  }
}
