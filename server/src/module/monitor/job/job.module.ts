import { Module } from '@nestjs/common';
import { JobLogController } from './job-log/job-log.controller';
import { JobLogService } from './job-log/job-log.service';
import { JobMainController } from './job-main/job-main.controller';
import { JobMainService } from './job-main/job-main.service';
import { TaskHandlers } from './taskHandlers';

@Module({
  controllers: [JobMainController, JobLogController],
  providers: [JobMainService, JobLogService, TaskHandlers],
})
export class JobModule {}
