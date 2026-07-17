import { Queue, Worker } from "bullmq";
import { ILoggerProvider } from "@shared/provider";
import { BullMQQueueProvider } from "./bullmq-queue-provider";

const mockQueueAdd = vi.fn();
const mockQueueClose = vi.fn();
const mockQueueGetJob = vi.fn();
const mockQueueGetJobCounts = vi.fn();
const mockQueueGetWaiting = vi.fn();
const mockQueueOn = vi.fn();
const mockWorkerOn = vi.fn();
const mockWorkerClose = vi.fn();
const { mockNotify } = vi.hoisted(() => ({ mockNotify: vi.fn() }));

vi.mock("bullmq", () => ({
  Queue: vi.fn().mockImplementation((name: string) => ({
    name,
    add: mockQueueAdd,
    close: mockQueueClose,
    getJob: mockQueueGetJob,
    getJobCounts: mockQueueGetJobCounts,
    getWaiting: mockQueueGetWaiting,
    on: mockQueueOn,
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: mockWorkerOn,
    close: mockWorkerClose,
  })),
}));

vi.mock("../../config", () => ({
  env: {
    REDIS_HOST: "localhost",
    REDIS_PORT: 6379,
    REDIS_PASSWORD: "",
    REDIS_DB: 0,
  },
}));

vi.mock("../../service/error-reporter", () => ({
  errorReporter: { notify: mockNotify },
}));

const mockLogger: ILoggerProvider = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const MockedQueue = vi.mocked(Queue);
const MockedWorker = vi.mocked(Worker);

describe("BullMQQueueProvider", () => {
  let sut: BullMQQueueProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no oldest-waiting job. Individual tests override as needed.
    mockQueueGetWaiting.mockResolvedValue([]);
    sut = new BullMQQueueProvider(mockLogger);
  });

  describe("createQueue", () => {
    it("should create a new queue", () => {
      sut.createQueue("test-queue");

      expect(MockedQueue).toHaveBeenCalledWith("test-queue", {
        connection: {
          host: "localhost",
          port: 6379,
          password: "",
          db: 0,
        },
      });
    });

    it("should not create a duplicate queue", () => {
      sut.createQueue("test-queue");
      sut.createQueue("test-queue");

      expect(MockedQueue).toHaveBeenCalledTimes(1);
    });

    it("should allow creating multiple different queues", () => {
      sut.createQueue("queue-a");
      sut.createQueue("queue-b");

      expect(MockedQueue).toHaveBeenCalledTimes(2);
    });
  });

  describe("addJob", () => {
    it("should add a job to an existing queue with default options", async () => {
      mockQueueAdd.mockResolvedValue({ id: "job-1" });
      sut.createQueue("test-queue");

      const jobId = await sut.addJob("test-queue", "process-data", {
        userId: "user-1",
      });

      expect(jobId).toBe("job-1");
      expect(mockQueueAdd).toHaveBeenCalledWith(
        "process-data",
        { userId: "user-1" },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: 100,
          removeOnFail: 1000,
          delay: undefined,
          priority: undefined,
        },
      );
    });

    it("should add a job with custom options", async () => {
      mockQueueAdd.mockResolvedValue({ id: "job-2" });
      sut.createQueue("test-queue");

      const jobId = await sut.addJob(
        "test-queue",
        "urgent-task",
        { data: "test" },
        {
          attempts: 5,
          delay: 3000,
          priority: 1,
          backoff: { type: "fixed", delay: 500 },
          removeOnComplete: true,
          removeOnFail: 50,
        },
      );

      expect(jobId).toBe("job-2");
      expect(mockQueueAdd).toHaveBeenCalledWith(
        "urgent-task",
        { data: "test" },
        {
          attempts: 5,
          backoff: { type: "fixed", delay: 500 },
          removeOnComplete: true,
          removeOnFail: 50,
          delay: 3000,
          priority: 1,
        },
      );
    });

    it("maps deduplicationId to BullMQ's deduplication option", async () => {
      mockQueueAdd.mockResolvedValue({ id: "job-3" });
      sut.createQueue("test-queue");

      await sut.addJob(
        "test-queue",
        "delete-patients",
        { ids: ["a"] },
        { deduplicationId: "delete-patients-abc123" },
      );

      expect(mockQueueAdd).toHaveBeenCalledWith(
        "delete-patients",
        { ids: ["a"] },
        expect.objectContaining({
          deduplication: { id: "delete-patients-abc123" },
        }),
      );
    });

    it("should throw an error when queue does not exist", async () => {
      await expect(
        sut.addJob("non-existent", "job", { data: "test" }),
      ).rejects.toThrow(
        'Queue "non-existent" not found. Call createQueue first.',
      );
    });
  });

  describe("removeJob", () => {
    it("removes an existing job and returns true", async () => {
      const jobRemove = vi.fn().mockResolvedValue(undefined);
      mockQueueGetJob.mockResolvedValue({ remove: jobRemove });
      sut.createQueue("test-queue");

      const removed = await sut.removeJob("test-queue", "job-1");

      expect(mockQueueGetJob).toHaveBeenCalledWith("job-1");
      expect(jobRemove).toHaveBeenCalled();
      expect(removed).toBe(true);
    });

    it("returns false when the queue does not exist (no throw)", async () => {
      const removed = await sut.removeJob("missing-queue", "job-1");
      expect(removed).toBe(false);
    });

    it("returns false when the job is not found", async () => {
      mockQueueGetJob.mockResolvedValue(null);
      sut.createQueue("test-queue");

      const removed = await sut.removeJob("test-queue", "job-1");
      expect(removed).toBe(false);
    });

    it("swallows a removal error (locked/active job) and returns false", async () => {
      const jobRemove = vi
        .fn()
        .mockRejectedValue(new Error("locked by worker"));
      mockQueueGetJob.mockResolvedValue({ remove: jobRemove });
      sut.createQueue("test-queue");

      const removed = await sut.removeJob("test-queue", "job-1");
      expect(removed).toBe(false);
    });
  });

  describe("registerProcessor", () => {
    it("should create a worker for a queue", () => {
      const processor = vi.fn();
      sut.registerProcessor("test-queue", processor);

      expect(MockedWorker).toHaveBeenCalledWith(
        "test-queue",
        expect.any(Function),
        {
          connection: {
            host: "localhost",
            port: 6379,
            password: "",
            db: 0,
          },
          concurrency: 1,
        },
      );
    });

    it("should create a worker with custom concurrency", () => {
      const processor = vi.fn();
      sut.registerProcessor("test-queue", processor, 5);

      expect(MockedWorker).toHaveBeenCalledWith(
        "test-queue",
        expect.any(Function),
        expect.objectContaining({ concurrency: 5 }),
      );
    });

    it("should not register a duplicate worker for the same queue", () => {
      const processor = vi.fn();
      sut.registerProcessor("test-queue", processor);
      sut.registerProcessor("test-queue", processor);

      expect(MockedWorker).toHaveBeenCalledTimes(1);
    });

    it("should register event listeners for completed, failed, error and stalled", () => {
      const processor = vi.fn();
      sut.registerProcessor("test-queue", processor);

      expect(mockWorkerOn).toHaveBeenCalledWith(
        "completed",
        expect.any(Function),
      );
      expect(mockWorkerOn).toHaveBeenCalledWith("failed", expect.any(Function));
      expect(mockWorkerOn).toHaveBeenCalledWith("error", expect.any(Function));
      expect(mockWorkerOn).toHaveBeenCalledWith(
        "stalled",
        expect.any(Function),
      );
    });

    it("registers a queue-level error listener on createQueue", () => {
      sut.createQueue("test-queue");

      expect(mockQueueOn).toHaveBeenCalledWith("error", expect.any(Function));
    });

    it("notifies the error tracker on TERMINAL job failure (with opaque metadata only)", () => {
      sut.registerProcessor("test-queue", vi.fn());
      const failedHandler = mockWorkerOn.mock.calls.find(
        (c) => c[0] === "failed",
      )![1] as (job: unknown, error: Error) => void;

      failedHandler(
        { id: "job-1", name: "embed", attemptsMade: 5, opts: { attempts: 5 } },
        new Error("boom"),
      );

      expect(mockNotify).toHaveBeenCalledTimes(1);
      const onError = mockNotify.mock.calls[0]![1] as (event: {
        severity?: string;
        addMetadata: ReturnType<typeof vi.fn>;
      }) => void;
      const event = {
        severity: undefined as string | undefined,
        addMetadata: vi.fn(),
      };
      onError(event);
      expect(event.severity).toBe("error");
      expect(event.addMetadata).toHaveBeenCalledWith("queue", {
        queue: "test-queue",
        jobId: "job-1",
        jobName: "embed",
        attemptsMade: 5,
      });
    });

    it("does NOT notify the error tracker on a retryable (non-terminal) failure", () => {
      sut.registerProcessor("test-queue", vi.fn());
      const failedHandler = mockWorkerOn.mock.calls.find(
        (c) => c[0] === "failed",
      )![1] as (job: unknown, error: Error) => void;

      failedHandler(
        { id: "job-1", name: "embed", attemptsMade: 1, opts: { attempts: 5 } },
        new Error("boom"),
      );

      expect(mockNotify).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("throttles infra-error notifications per queue (logs every time)", () => {
      sut.registerProcessor("test-queue", vi.fn());
      const errorHandler = mockWorkerOn.mock.calls.find(
        (c) => c[0] === "error",
      )![1] as (error: Error) => void;

      errorHandler(new Error("ECONNREFUSED"));
      errorHandler(new Error("ECONNREFUSED"));
      errorHandler(new Error("ECONNREFUSED"));

      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledTimes(3);
    });

    it("should call the processor with mapped job data", async () => {
      const processor = vi.fn().mockResolvedValue(undefined);

      MockedWorker.mockImplementationOnce(
        (_name: any, processorFn: any, _opts: any) => {
          processorFn({
            id: "job-1",
            name: "test-job",
            data: { key: "value" },
            progress: 0,
          });
          return { on: mockWorkerOn, close: mockWorkerClose } as any;
        },
      );

      sut.registerProcessor("test-queue", processor);

      expect(processor).toHaveBeenCalledWith({
        id: "job-1",
        name: "test-job",
        data: { key: "value" },
        progress: 0,
        attemptsMade: 0,
        maxAttempts: 1,
      });
    });
  });

  describe("getAllQueueStatuses", () => {
    it("returns the full job snapshot for every registered queue", async () => {
      mockQueueGetJobCounts.mockResolvedValue({
        waiting: 3,
        active: 1,
        delayed: 4,
        completed: 9,
        failed: 2,
      });
      mockQueueGetWaiting.mockResolvedValue([{ timestamp: Date.now() - 5000 }]);
      sut.createQueue("queue-a");
      sut.createQueue("queue-b");

      const statuses = await sut.getAllQueueStatuses();

      expect(statuses).toHaveLength(2);
      expect(statuses[0]).toMatchObject({
        name: "queue-a",
        waiting: 3,
        active: 1,
        delayed: 4,
        completed: 9,
        failed: 2,
      });
      // oldestWaitingMs is derived from the oldest waiting job's timestamp.
      expect(statuses[0]!.oldestWaitingMs).toBeGreaterThanOrEqual(5000);
      expect(mockQueueGetJobCounts).toHaveBeenCalledWith(
        "waiting",
        "active",
        "delayed",
        "completed",
        "failed",
      );
    });

    it("reports oldestWaitingMs as null when no job is waiting", async () => {
      mockQueueGetJobCounts.mockResolvedValue({
        waiting: 0,
        active: 0,
        delayed: 0,
        completed: 0,
        failed: 0,
      });
      mockQueueGetWaiting.mockResolvedValue([]);
      sut.createQueue("queue-a");

      const statuses = await sut.getAllQueueStatuses();

      expect(statuses[0]!.oldestWaitingMs).toBeNull();
    });

    it("returns an empty array when no queues are registered", async () => {
      const statuses = await sut.getAllQueueStatuses();
      expect(statuses).toEqual([]);
    });

    it("degrades a failing queue to zeroed counts instead of throwing", async () => {
      mockQueueGetJobCounts.mockRejectedValue(new Error("redis down"));
      sut.createQueue("queue-a");

      const statuses = await sut.getAllQueueStatuses();

      expect(statuses).toEqual([
        {
          name: "queue-a",
          waiting: 0,
          active: 0,
          delayed: 0,
          completed: 0,
          failed: 0,
          oldestWaitingMs: null,
        },
      ]);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe("shutdown", () => {
    it("should close all workers and queues", async () => {
      mockQueueClose.mockResolvedValue(undefined);
      mockWorkerClose.mockResolvedValue(undefined);

      sut.createQueue("queue-a");
      sut.createQueue("queue-b");
      sut.registerProcessor("queue-a", vi.fn());

      await sut.shutdown();

      expect(mockWorkerClose).toHaveBeenCalledTimes(1);
      expect(mockQueueClose).toHaveBeenCalledTimes(2);
    });

    it("should handle shutdown with no queues or workers", async () => {
      await expect(sut.shutdown()).resolves.not.toThrow();
    });
  });
});
