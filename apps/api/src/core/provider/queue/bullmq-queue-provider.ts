import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { Queue, Worker, type ConnectionOptions } from "bullmq";
import {
  IQueueProvider,
  ILoggerProvider,
  JobData,
  JobOptions,
  JobProcessor,
  FailedJobSnapshot,
  QueueHealthSnapshot,
  QueueStatusSnapshot,
} from "@shared/provider";
import { NotFoundError, ErrorCodes } from "@shared/error";
import { errorReporter } from "../../service/error-reporter";
import { env } from "../../config";

/**
 * Failed-job retention per queue. BullMQ keeps up to this many failed jobs
 * in the `failed` set — effectively the dead-letter queue. Inspectable via
 * `getFailedJobs(queueName)` once the admin dashboard is added. Bumped from
 * 200 → 1000 so we have a useful trail for on-call post-mortems.
 */
const FAILED_JOB_RETENTION = 1000;

@injectable()
export class BullMQQueueProvider implements IQueueProvider {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private lastInfraNotifyAt: Map<string, number> = new Map();

  constructor(
    @inject(DI_TOKENS.LoggerProvider) private readonly logger: ILoggerProvider,
  ) {}

  /**
   * Reports an infrastructure-level failure (connection error, stalled job) to
   * Bugsnag at most once per queue per window — a Redis outage fires the
   * `error` event on every reconnect attempt and would flood the tracker.
   * Everything still lands in pino unthrottled.
   */
  private notifyInfraFailure(
    key: string,
    error: Error,
    context: Record<string, unknown>,
  ): void {
    const WINDOW_MS = 5 * 60 * 1000;
    const last = this.lastInfraNotifyAt.get(key) ?? 0;
    if (Date.now() - last < WINDOW_MS) return;
    this.lastInfraNotifyAt.set(key, Date.now());
    errorReporter.notify(error, (event) => {
      event.severity = "error";
      event.addMetadata("queue", context);
    });
  }

  private get connection(): ConnectionOptions {
    return {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      db: env.REDIS_DB,
    };
  }

  createQueue(name: string): void {
    if (this.queues.has(name)) return;

    const queue = new Queue(name, { connection: this.connection });
    // Without this listener BullMQ dumps connection failures on the raw
    // console — invisible to pino and Bugsnag.
    queue.on("error", (error) => {
      this.logger.error(
        { queue: name, error: error.message },
        "Queue connection error",
      );
      this.notifyInfraFailure(`queue:${name}`, error, {
        queue: name,
        source: "queue",
      });
    });
    this.queues.set(name, queue);
    this.logger.info({ queue: name }, "Queue created");
  }

  async addJob<T = unknown>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions,
  ): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new NotFoundError(
        `Queue "${queueName}" not found. Call createQueue first.`,
        undefined,
        ErrorCodes.QUEUE_NOT_FOUND,
      );
    }

    const job = await queue.add(jobName, data, {
      attempts: options?.attempts ?? 3,
      backoff: options?.backoff ?? { type: "exponential", delay: 1000 },
      removeOnComplete: options?.removeOnComplete ?? 100,
      removeOnFail: options?.removeOnFail ?? FAILED_JOB_RETENTION,
      delay: options?.delay,
      priority: options?.priority,
      ...(options?.jobId && { jobId: options.jobId }),
      ...(options?.deduplicationId && {
        deduplication: { id: options.deduplicationId },
      }),
    });

    this.logger.info(
      { queue: queueName, jobName, jobId: job.id },
      "Job added to queue",
    );
    return job.id!;
  }

  registerProcessor<T = unknown, R = void>(
    queueName: string,
    processor: JobProcessor<T, R>,
    concurrency = 1,
  ): void {
    if (this.workers.has(queueName)) {
      this.logger.warn(
        { queue: queueName },
        "Worker already registered, skipping",
      );
      return;
    }

    const worker = new Worker(
      queueName,
      async (job) => {
        const jobData: JobData<T> = {
          id: job.id!,
          name: job.name,
          data: job.data as T,
          progress: job.progress as number,
          attemptsMade: job.attemptsMade ?? 0,
          maxAttempts: job.opts?.attempts ?? 1,
        };
        return processor(jobData);
      },
      { connection: this.connection, concurrency },
    );

    worker.on("completed", (job) => {
      this.logger.info(
        { queue: queueName, jobId: job.id, jobName: job.name },
        "Job completed",
      );
    });

    worker.on("failed", (job, error) => {
      const terminal = (job?.attemptsMade ?? 0) >= (job?.opts?.attempts ?? 1);
      this.logger.error(
        {
          queue: queueName,
          jobId: job?.id,
          jobName: job?.name,
          attemptsMade: job?.attemptsMade,
          maxAttempts: job?.opts?.attempts,
          terminal,
          error: error.message,
          stack: error.stack,
        },
        "Job failed",
      );
      // Terminal failure = the job dead-lettered after all retries. That must
      // reach the error tracker, not just the log stream. Only opaque ids in
      // the metadata — job payloads can carry PHI.
      if (terminal) {
        errorReporter.notify(error, (event) => {
          event.severity = "error";
          event.addMetadata("queue", {
            queue: queueName,
            jobId: job?.id,
            jobName: job?.name,
            attemptsMade: job?.attemptsMade,
          });
        });
      }
    });

    worker.on("error", (error) => {
      this.logger.error(
        { queue: queueName, error: error.message },
        "Worker connection error",
      );
      this.notifyInfraFailure(`worker:${queueName}`, error, {
        queue: queueName,
        source: "worker",
      });
    });

    worker.on("stalled", (jobId) => {
      this.logger.warn(
        { queue: queueName, jobId },
        "Job stalled — lock lost, will be retried",
      );
      this.notifyInfraFailure(
        `stalled:${queueName}`,
        new Error(`BullMQ job stalled on queue ${queueName}`),
        { queue: queueName, jobId, source: "stalled" },
      );
    });

    this.workers.set(queueName, worker);
    this.logger.info({ queue: queueName, concurrency }, "Worker registered");
  }

  async removeJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) return false;
    try {
      const job = await queue.getJob(jobId);
      if (!job) return false;
      await job.remove();
      this.logger.info({ queue: queueName, jobId }, "Queued job removed");
      return true;
    } catch (error) {
      // A locked/active job (a worker holds it) can't be removed — that's
      // expected and handled by the processors' cancel-aware guards. Swallow so
      // a removal hiccup never breaks the cancel flow.
      this.logger.warn(
        {
          queue: queueName,
          jobId,
          error: error instanceof Error ? error.message : String(error),
        },
        "Queued job removal skipped",
      );
      return false;
    }
  }

  getQueues(): Queue[] {
    return Array.from(this.queues.values());
  }

  async getFailedJobs(
    queueName: string,
    limit = 50,
  ): Promise<FailedJobSnapshot[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new NotFoundError(
        `Queue "${queueName}" not found`,
        undefined,
        ErrorCodes.QUEUE_NOT_FOUND,
      );
    }
    const jobs = await queue.getFailed(0, Math.max(0, limit - 1));
    return jobs.map<FailedJobSnapshot>((job) => ({
      id: job.id ?? "",
      name: job.name,
      data: job.data,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason ?? null,
      stacktrace: job.stacktrace ?? [],
      failedAt: job.finishedOn ? new Date(job.finishedOn) : null,
    }));
  }

  async getQueueHealth(queueName: string): Promise<QueueHealthSnapshot> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new NotFoundError(
        `Queue "${queueName}" not found`,
        undefined,
        ErrorCodes.QUEUE_NOT_FOUND,
      );
    }

    const counts = await queue.getJobCounts(
      "waiting",
      "active",
      "delayed",
      "completed",
      "failed",
    );
    // `getWaiting(0, 0)` returns at most one element (BullMQ uses inclusive
    // ranges). The waiting list is FIFO ordered by enqueue time, so the
    // first element is the oldest still-pending job — its `timestamp`
    // (millis since epoch) gives us the lag.
    const oldest = await queue.getWaiting(0, 0);
    const oldestWaitingMs =
      oldest.length > 0 && oldest[0]?.timestamp
        ? Date.now() - oldest[0].timestamp
        : null;

    return {
      queueName,
      waiting: counts["waiting"] ?? 0,
      active: counts["active"] ?? 0,
      delayed: counts["delayed"] ?? 0,
      completed: counts["completed"] ?? 0,
      failed: counts["failed"] ?? 0,
      oldestWaitingMs,
      sampledAt: new Date(),
    };
  }

  async getAllQueueStatuses(): Promise<QueueStatusSnapshot[]> {
    const queues = Array.from(this.queues.values());
    return Promise.all(
      queues.map(async (queue) => {
        try {
          const counts = await queue.getJobCounts(
            "waiting",
            "active",
            "delayed",
            "completed",
            "failed",
          );
          const waiting = counts["waiting"] ?? 0;
          // Mirror getQueueHealth: the first waiting job (FIFO) is the oldest
          // still-pending one — its age is the single best "is the worker
          // keeping up?" signal. Skip the extra Redis round-trip when nothing
          // is waiting (nothing to measure).
          let oldestWaitingMs: number | null = null;
          if (waiting > 0) {
            const oldest = await queue.getWaiting(0, 0);
            oldestWaitingMs =
              oldest.length > 0 && oldest[0]?.timestamp
                ? Date.now() - oldest[0].timestamp
                : null;
          }
          return {
            name: queue.name,
            waiting,
            active: counts["active"] ?? 0,
            delayed: counts["delayed"] ?? 0,
            completed: counts["completed"] ?? 0,
            failed: counts["failed"] ?? 0,
            oldestWaitingMs,
          };
        } catch (error) {
          // A Redis hiccup for one queue must not blank the whole panel —
          // report the queue with zeroed counts rather than throwing.
          this.logger.warn(
            {
              queue: queue.name,
              error: error instanceof Error ? error.message : String(error),
            },
            "Failed to read job counts for status panel",
          );
          return {
            name: queue.name,
            waiting: 0,
            active: 0,
            delayed: 0,
            completed: 0,
            failed: 0,
            oldestWaitingMs: null,
          };
        }
      }),
    );
  }

  async shutdown(): Promise<void> {
    this.logger.info(
      { service: "bullmq" },
      "Shutting down queue workers and queues",
    );

    const workerCloses = Array.from(this.workers.values()).map((w) =>
      w.close(),
    );
    await Promise.all(workerCloses);

    const queueCloses = Array.from(this.queues.values()).map((q) => q.close());
    await Promise.all(queueCloses);

    this.logger.info({ service: "bullmq" }, "All queues and workers closed");
  }
}
