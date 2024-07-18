import { Module } from '@nestjs/common';
import { JobMainService } from './job-main/job-main.service';
import { JobMainController } from './job-main/job-main.controller';
import { JobLogService } from './job-log/job-log.service';
import { JobLogController } from './job-log/job-log.controller';
import { TaskHandlers } from './taskHandlers';

@Module({
  controllers: [JobMainController, JobLogController],
  providers: [JobMainService, JobLogService, TaskHandlers],
})
export class JobModule {}
