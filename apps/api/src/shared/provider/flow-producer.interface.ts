import type { JobOptions } from "./queue-provider.interface";

export interface FlowChildOptions extends JobOptions {
  /**
   * When false, a child that exhausts its retries does NOT propagate
   * failure to the parent — the parent flow node still runs. Required for
   * imports so the finalizer always runs and cleans up.
   */
  failParentOnFailure?: boolean;
}

export interface FlowChildSpec {
  name: string;
  queueName: string;
  data: unknown;
  opts?: FlowChildOptions;
}

export interface FlowSpec {
  name: string;
  queueName: string;
  data: unknown;
  opts?: JobOptions;
  children: FlowChildSpec[];
}

// BullMQ exposes parent/children flows through a `FlowProducer` API that's
// fundamentally different from the per-job `Queue` API. Keep that
// abstraction explicit so application code talks contracts, not bullmq.
export interface IFlowProducer {
  enqueue(flow: FlowSpec): Promise<void>;
  shutdown(): Promise<void>;
}
