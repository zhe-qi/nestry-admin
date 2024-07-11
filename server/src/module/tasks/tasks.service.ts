import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class TasksService {
  constructor(private scheduler: SchedulerRegistry) {}

  private readonly logger = new Logger(TasksService.name);

  // @Cron('45 * * * * *')
  // handleCron() {
  //   this.logger.debug('Called when the current second is 45');
  // }

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
