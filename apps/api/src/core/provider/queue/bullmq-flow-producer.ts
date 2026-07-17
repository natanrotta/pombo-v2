import { injectable } from "tsyringe";
import { FlowProducer, type ConnectionOptions, type FlowJob } from "bullmq";
import type {
  FlowChildSpec,
  FlowSpec,
  IFlowProducer,
} from "@shared/provider/flow-producer.interface";
import type { JobOptions } from "@shared/provider/queue-provider.interface";
import { env } from "@core/config";

@injectable()
export class BullMQFlowProducer implements IFlowProducer {
  private producer: FlowProducer | null = null;

  async enqueue(flow: FlowSpec): Promise<void> {
    const producer = this.getProducer();
    await producer.add(toFlowJob(flow));
  }

  async shutdown(): Promise<void> {
    if (this.producer) {
      await this.producer.close().catch(() => undefined);
      this.producer = null;
    }
  }

  private getProducer(): FlowProducer {
    if (this.producer) return this.producer;
    const connection: ConnectionOptions = {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      db: env.REDIS_DB,
    };
    this.producer = new FlowProducer({ connection });
    return this.producer;
  }
}

function toFlowJob(spec: FlowSpec | FlowChildSpec): FlowJob {
  const job: FlowJob = {
    name: spec.name,
    queueName: spec.queueName,
    data: spec.data,
    opts: spec.opts as JobOptions | undefined,
  };
  if ("children" in spec && spec.children.length > 0) {
    job.children = spec.children.map(toFlowJob);
  }
  return job;
}
