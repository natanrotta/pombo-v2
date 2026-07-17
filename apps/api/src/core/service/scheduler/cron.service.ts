import cron, { type ScheduledTask } from "node-cron";
import { logger } from "../../http/logger";

interface CronJob {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
}

class CronService {
  private jobs: CronJob[] = [];
  private tasks: ScheduledTask[] = [];

  register(job: CronJob): void {
    this.jobs.push(job);
  }

  start(): void {
    for (const job of this.jobs) {
      const task = cron.schedule(job.schedule, async () => {
        logger.info({ job: job.name }, "Cron job started");

        try {
          await job.handler();
          logger.info({ job: job.name }, "Cron job completed");
        } catch (error) {
          logger.error(
            {
              service: "cron",
              job: job.name,
              error: error instanceof Error ? error.message : error,
            },
            "Cron job failed",
          );
        }
      });
      this.tasks.push(task);

      logger.info(
        { job: job.name, schedule: job.schedule },
        "Cron job registered",
      );
    }
  }

  /**
   * Stops all scheduled tasks. Must run FIRST in the graceful-shutdown path —
   * a tick that fires mid-shutdown would enqueue into a closing queue provider.
   */
  stop(): void {
    for (const task of this.tasks) {
      task.stop();
    }
    this.tasks = [];
    logger.info({ service: "cron" }, "Cron jobs stopped");
  }
}

export const cronService = new CronService();
