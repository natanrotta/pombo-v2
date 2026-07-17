/**
 * CI/CD primitives surfaced by the admin "Deploys" panel. Normalized from the
 * GitHub Actions API to the handful of fields the panel renders, so the
 * application layer never sees the provider's wire shape.
 */

/** Which of our two production workflows a run belongs to. */
export type CiWorkflow = "build" | "deploy";

/** Lifecycle of a run. GitHub's richer set (requested/waiting/pending) is
 *  collapsed to these three. */
export type CiRunStatus = "queued" | "in_progress" | "completed";

/** Outcome of a completed run (`null` while still running). GitHub's extra
 *  conclusions (timed_out, startup_failure, neutral, ...) collapse to
 *  failure / other so the panel always has a tone to render. */
export type CiRunConclusion =
  "success" | "failure" | "cancelled" | "skipped" | "other" | null;

/** A single CI/CD run, normalized for the panel. */
export interface CiRun {
  /** GitHub run id (stringified). */
  id: string;
  workflow: CiWorkflow;
  /** Human title of the run (commit subject / dispatch title). */
  title: string;
  status: CiRunStatus;
  conclusion: CiRunConclusion;
  /** Short commit sha (7 chars). */
  sha: string;
  /** Who triggered the run (GitHub login), or "—". */
  actor: string;
  /** Trigger event (push / workflow_dispatch). */
  event: string;
  runNumber: number;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
  /** Link to the run on GitHub. */
  url: string;
}

/**
 * Why the run list may be empty, mirroring the node_exporter degrade pattern:
 * - `ok`: the call succeeded (runs may still be empty if nothing ran yet).
 * - `not_configured`: no `GITHUB_ACTIONS_TOKEN` set (no call attempted).
 * - `unreachable`: token set but the GitHub call failed (timeout, non-2xx,
 *   rate limit, network) — the panel shows a warning instead of "no deploys".
 */
export type CiRunsStatus = "ok" | "not_configured" | "unreachable";

export interface CiRunsResult {
  status: CiRunsStatus;
  runs: CiRun[];
}

/** One step inside a CI job (e.g. "Run tests", "Build & push", "Criar tag"). */
export interface CiStep {
  name: string;
  status: CiRunStatus;
  conclusion: CiRunConclusion;
  /** 1-based order of the step within the job. */
  number: number;
}

/** One job of a run (e.g. the test gate, the build job), with its steps. */
export interface CiJob {
  /** GitHub job id (stringified) — addresses the per-job logs endpoint. */
  id: string;
  name: string;
  status: CiRunStatus;
  conclusion: CiRunConclusion;
  /** ISO timestamps (`null` until the job starts / finishes). */
  startedAt: string | null;
  completedAt: string | null;
  steps: CiStep[];
}

/** Jobs+steps of one run (pipeline stepper). Same degrade discriminant as
 *  `CiRunsResult`: `not_configured` / `unreachable` / `ok` (jobs may be empty
 *  while the run is still queued). */
export interface CiRunDetailResult {
  status: CiRunsStatus;
  jobs: CiJob[];
}

/** Truncated plain-text logs of one job (terminal console). Same discriminant;
 *  `log` is empty when the job hasn't produced logs yet (`ok` + empty). */
export interface CiJobLogsResult {
  status: CiRunsStatus;
  log: string;
}

/**
 * Port over a CI/CD provider (GitHub Actions), READ-ONLY. The infrastructure
 * adapter owns the token + repo (from env), keeping the application layer free
 * of config. Every method is total — it never throws; failures degrade to a
 * status. Production build/deploy is dispatched from the terminal CLI
 * (`yarn make-tag` / `yarn deploy`), not from the admin panel — so there is no
 * `trigger*` method here.
 */
export interface ICiProvider {
  /** Recent runs of the build/deploy workflows, newest first, capped at
   *  `limit`. Never throws. */
  listRuns(limit: number): Promise<CiRunsResult>;

  /** Jobs + steps of one run, for the pipeline stepper. Never throws. */
  getRunSteps(runId: string): Promise<CiRunDetailResult>;

  /** Truncated plain-text logs of one job, for the console. Never throws. */
  getJobLogs(jobId: string): Promise<CiJobLogsResult>;
}
