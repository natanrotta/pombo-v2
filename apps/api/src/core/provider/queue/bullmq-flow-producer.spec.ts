import "reflect-metadata";

const { mockFlowProducerAdd, mockFlowProducerClose, FlowProducerCtor } =
  vi.hoisted(() => {
    const add = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const ctor = vi.fn().mockImplementation(() => ({ add, close }));
    return {
      mockFlowProducerAdd: add,
      mockFlowProducerClose: close,
      FlowProducerCtor: ctor,
    };
  });

vi.mock("bullmq", () => ({ FlowProducer: FlowProducerCtor }));

vi.mock("../../config", () => ({
  env: {
    NODE_ENV: "test",
    REDIS_HOST: "localhost",
    REDIS_PORT: 6379,
    REDIS_PASSWORD: "secret",
    REDIS_DB: 0,
  },
}));

import { BullMQFlowProducer } from "./bullmq-flow-producer";
import type { FlowSpec } from "@shared/provider/flow-producer.interface";

describe("BullMQFlowProducer", () => {
  let sut: BullMQFlowProducer;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new BullMQFlowProducer();
  });

  it("translates a FlowSpec into a BullMQ FlowJob (parent + nested children)", async () => {
    const spec: FlowSpec = {
      name: "finalize-import",
      queueName: "import-finalize",
      data: { importJobId: "j-1", accountId: "a-1" },
      opts: { attempts: 3 },
      children: [
        {
          name: "process-batch",
          queueName: "import-batch",
          data: { batchId: "b-1" },
          opts: { jobId: "import-batch-b-1", failParentOnFailure: false },
        },
        {
          name: "process-batch",
          queueName: "import-batch",
          data: { batchId: "b-2" },
          opts: { jobId: "import-batch-b-2", failParentOnFailure: false },
        },
      ],
    };

    await sut.enqueue(spec);

    expect(mockFlowProducerAdd).toHaveBeenCalledWith({
      name: "finalize-import",
      queueName: "import-finalize",
      data: { importJobId: "j-1", accountId: "a-1" },
      opts: { attempts: 3 },
      children: [
        {
          name: "process-batch",
          queueName: "import-batch",
          data: { batchId: "b-1" },
          opts: { jobId: "import-batch-b-1", failParentOnFailure: false },
        },
        {
          name: "process-batch",
          queueName: "import-batch",
          data: { batchId: "b-2" },
          opts: { jobId: "import-batch-b-2", failParentOnFailure: false },
        },
      ],
    });
  });

  it("instantiates FlowProducer once and reuses across calls", async () => {
    await sut.enqueue({
      name: "p",
      queueName: "q",
      data: {},
      children: [],
    });
    await sut.enqueue({
      name: "p2",
      queueName: "q",
      data: {},
      children: [],
    });

    expect(FlowProducerCtor).toHaveBeenCalledTimes(1);
    expect(mockFlowProducerAdd).toHaveBeenCalledTimes(2);
  });

  it("passes the configured Redis connection to FlowProducer", async () => {
    await sut.enqueue({ name: "p", queueName: "q", data: {}, children: [] });

    expect(FlowProducerCtor).toHaveBeenCalledWith({
      connection: { host: "localhost", port: 6379, password: "secret", db: 0 },
    });
  });

  it("omits children prop when the spec has none", async () => {
    await sut.enqueue({ name: "p", queueName: "q", data: {}, children: [] });

    const [job] = mockFlowProducerAdd.mock.calls[0]!;
    expect((job as { children?: unknown[] }).children).toBeUndefined();
  });

  describe("shutdown", () => {
    it("closes the producer when one was created", async () => {
      await sut.enqueue({ name: "p", queueName: "q", data: {}, children: [] });
      await sut.shutdown();
      expect(mockFlowProducerClose).toHaveBeenCalled();
    });

    it("is a no-op when no producer was lazily created", async () => {
      await expect(sut.shutdown()).resolves.toBeUndefined();
      expect(mockFlowProducerClose).not.toHaveBeenCalled();
    });

    it("swallows close errors so SIGTERM cleanup never blocks", async () => {
      await sut.enqueue({ name: "p", queueName: "q", data: {}, children: [] });
      mockFlowProducerClose.mockRejectedValueOnce(new Error("redis down"));
      await expect(sut.shutdown()).resolves.toBeUndefined();
    });
  });
});
