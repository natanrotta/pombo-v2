export interface JobOptions {
  delay?: number;
  attempts?: number;
  backoff?: { type: "fixed" | "exponential"; delay: number };
  priority?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  /** Unique job ID — BullMQ ignores duplicate jobs with the same ID. */
  jobId?: string;
  /**
   * Collapses duplicate enqueues while a job with the same id is still
   * pending/active. Unlike `jobId`, a finished (completed OR failed) job
   * frees the id immediately, so legit re-runs and retries are never
   * blocked by retention windows.
   */
  deduplicationId?: string;
}

export interface JobData<T = unknown> {
  id: string;
  name: string;
  data: T;
  progress: number;
  /**
   * Zero-based count of attempts already made BEFORE this invocation.
   * Optional in the type (existing tests construct minimal `JobData`
   * literals); the BullMQ provider always populates it in production. Treat
   * `undefined` as "no retry information available — assume terminal".
   */
  attemptsMade?: number;
  /** Maximum attempts this job is configured for, including the first try. */
  maxAttempts?: number;
}

export type JobProcessor<T = unknown, R = void> = (
  job: JobData<T>,
) => Promise<R>;

export interface FailedJobSnapshot {
  id: string;
  name: string;
  data: unknown;
  attemptsMade: number;
  failedReason: string | null;
  stacktrace: string[];
  failedAt: Date | null;
}

/**
 * Snapshot of a queue's runtime health. The `oldestWaitingMs` field is the
 * single most useful metric for "is the worker keeping up?": when it grows
 * beyond a few minutes the queue is backing up, regardless of total count.
 */
export interface QueueHealthSnapshot {
  queueName: string;
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  /** Age (ms) of the oldest job currently in `waiting`. `null` when empty. */
  oldestWaitingMs: number | null;
  /** Wall-clock instant when the snapshot was taken. */
  sampledAt: Date;
}

/**
 * Per-queue job snapshot for the admin status panel, across every registered
 * queue. Carries the same counters as {@link QueueHealthSnapshot} (minus the
 * sample instant) so the panel can show backlog/throughput at a glance and
 * flag a backing-up queue via `oldestWaitingMs`.
 */
export interface QueueStatusSnapshot {
  name: string;
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  /** Age (ms) of the oldest job still in `waiting`. `null` when empty. */
  oldestWaitingMs: number | null;
}

export interface IQueueProvider {
  createQueue(name: string): void;
  addJob<T = unknown>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions,
  ): Promise<string>;
  registerProcessor<T = unknown, R = void>(
    queueName: string,
    processor: JobProcessor<T, R>,
    concurrency?: number,
  ): void;
  /**
   * Best-effort removal of a single queued job by id. Returns `false` when the
   * queue or job is absent, or when the job is locked/active (BullMQ refuses to
   * remove a job a worker currently holds). Used by import cancellation to clear
   * still-pending work from Redis; the processors' cancel-aware guards stop
   * whatever is already mid-flight. Never throws — cleanup must not break cancel.
   */
  removeJob(queueName: string, jobId: string): Promise<boolean>;
  /**
   * Dead-letter inspection. Returns jobs that exhausted all retries and
   * still failed. BullMQ keeps them in the `failed` set — this method is a
   * typed view over that. Useful for on-call dashboards and manual retries.
   */
  getFailedJobs(
    queueName: string,
    limit?: number,
  ): Promise<FailedJobSnapshot[]>;
  /**
   * Snapshot of the queue's current state for monitoring/alerting. Cheap
   * enough to call from a health endpoint — uses BullMQ's pre-computed
   * counters and a single `getWaiting(0, 0)` for the oldest job.
   */
  getQueueHealth(queueName: string): Promise<QueueHealthSnapshot>;
  /**
   * Job counts (waiting / active / failed) for every registered queue, for
   * the admin status panel. Never throws: an unreachable Redis yields zeroed
   * counts per queue so the endpoint still responds.
   */
  getAllQueueStatuses(): Promise<QueueStatusSnapshot[]>;
  shutdown(): Promise<void>;
}
