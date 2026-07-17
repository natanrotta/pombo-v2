import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import {
  ICiProvider,
  CiRun,
  CiRunsResult,
  CiRunDetailResult,
  CiJobLogsResult,
  CiJob,
  CiStep,
  CiRunStatus,
  CiRunConclusion,
  CiWorkflow,
  ILoggerProvider,
} from "@shared/provider";
import { env } from "../../config";

/** How long we wait for the GitHub API before giving up. A slow/over-rate
 *  GitHub degrades the panel, never the endpoint. */
const REQUEST_TIMEOUT_MS = 4000;

/** GitHub caps `per_page` at 100. */
const MAX_PER_PAGE = 100;

/** Job logs are bounded so a huge run can't blow up the response: keep the TAIL
 *  (most recent output), capped at whichever limit is hit first. */
const LOG_MAX_LINES = 500;
const LOG_MAX_BYTES = 256 * 1024;

/** The two production workflows the panel tracks, keyed by their workflow file
 *  name (the GitHub Actions per-workflow endpoint addresses runs by file). */
const WORKFLOW_FILES: ReadonlyArray<{ file: string; workflow: CiWorkflow }> = [
  { file: "build-api.yml", workflow: "build" },
  { file: "deploy-api.yml", workflow: "deploy" },
];

/** The slice of the GitHub Actions run object we read. */
interface GitHubRun {
  id?: number | string;
  name?: string;
  display_title?: string;
  head_sha?: string;
  status?: string;
  conclusion?: string | null;
  run_number?: number;
  event?: string;
  created_at?: string;
  updated_at?: string;
  html_url?: string;
  actor?: { login?: string };
}

/** The slice of the GitHub Actions job object we read. */
interface GitHubJob {
  id?: number | string;
  name?: string;
  status?: string;
  conclusion?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  steps?: unknown[];
}

/** The slice of the GitHub Actions step object we read. */
interface GitHubStep {
  name?: string;
  status?: string;
  conclusion?: string | null;
  number?: number;
}

function errMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Reads recent CI/CD runs from the GitHub Actions API for the admin "Deploys"
 * panel. Uses the native Node 22 `fetch` with an `AbortSignal.timeout` — no
 * axios, no new dependency (same shape as NodeExporterMetricsProvider).
 *
 * Degradation is total and silent: no token → `not_configured`; all GitHub
 * calls failing → `unreachable`. It never throws, so the endpoint always
 * resolves 200 and the panel tells the operator which case it is. The token is
 * read from env and never returned to the caller.
 */
@injectable()
export class GitHubActionsCiProvider implements ICiProvider {
  constructor(
    @inject(DI_TOKENS.LoggerProvider) private readonly logger: ILoggerProvider,
  ) {}

  async listRuns(limit: number): Promise<CiRunsResult> {
    const token = env.GITHUB_ACTIONS_TOKEN;
    // No token: an ops gap (env not set), not an outage. The panel shows the
    // "configure o token" hint instead of a false "no deploys".
    if (!token) return { status: "not_configured", runs: [] };

    // One call PER workflow (not the combined /actions/runs endpoint) so a noisy
    // repo — many quality.yml runs between deploys — can NEVER starve our two
    // workflows out of a shared window. Each call fetches the latest `limit` of
    // its own workflow; we merge, sort newest-first and slice.
    const perWorkflow = await Promise.all(
      WORKFLOW_FILES.map(({ file, workflow }) =>
        this.fetchWorkflowRuns(file, workflow, token, limit),
      ),
    );

    // All calls failed → unreachable. They share token/host/instant, so in
    // practice they fail together (rate limit, bad token, network, GitHub down).
    // A partial failure (one workflow null) still returns `ok` with what we got,
    // logged above — better than hiding every deploy on one transient blip.
    if (perWorkflow.every((runs) => runs === null))
      return { status: "unreachable", runs: [] };

    const runs = perWorkflow
      .flatMap((runs) => runs ?? [])
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, Math.max(0, limit));
    return { status: "ok", runs };
  }

  async getRunSteps(runId: string): Promise<CiRunDetailResult> {
    const token = env.GITHUB_ACTIONS_TOKEN;
    if (!token) return { status: "not_configured", jobs: [] };

    const url = `https://api.github.com/repos/${env.GITHUB_REPO}/actions/runs/${runId}/jobs?per_page=${MAX_PER_PAGE}`;
    try {
      const response = await fetch(url, {
        headers: this.authHeaders(token),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(
          {
            service: "github-actions",
            repo: env.GITHUB_REPO,
            runId,
            status: response.status,
          },
          "GitHub run jobs fetch returned non-2xx",
        );
        return { status: "unreachable", jobs: [] };
      }
      const body = (await response.json()) as { jobs?: unknown[] };
      return { status: "ok", jobs: normalizeJobs(body.jobs ?? []) };
    } catch (error) {
      this.logger.warn(
        {
          service: "github-actions",
          repo: env.GITHUB_REPO,
          runId,
          error: errMessage(error),
        },
        "GitHub run jobs fetch failed",
      );
      return { status: "unreachable", jobs: [] };
    }
  }

  async getJobLogs(jobId: string): Promise<CiJobLogsResult> {
    const token = env.GITHUB_ACTIONS_TOKEN;
    if (!token) return { status: "not_configured", log: "" };

    const url = `https://api.github.com/repos/${env.GITHUB_REPO}/actions/jobs/${jobId}/logs`;
    try {
      // GitHub answers with a 302 to a short-lived signed blob URL. Follow it
      // MANUALLY and re-fetch the blob WITHOUT the Authorization header — the
      // signed URL needs no auth and must never receive our PAT (R5/R22).
      const response = await fetch(url, {
        headers: this.authHeaders(token),
        redirect: "manual",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      // A job that hasn't produced logs yet → 404. Not an outage: the panel
      // shows "Aguardando logs…", so report ok with empty text.
      if (response.status === 404) return { status: "ok", log: "" };

      let text: string;
      if (response.status === 301 || response.status === 302) {
        const location = response.headers.get("location");
        if (!location) return { status: "unreachable", log: "" };
        const blob = await fetch(location, {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (blob.status === 404) return { status: "ok", log: "" };
        if (!blob.ok) {
          this.logger.warn(
            {
              service: "github-actions",
              repo: env.GITHUB_REPO,
              jobId,
              status: blob.status,
            },
            "GitHub job logs blob fetch returned non-2xx",
          );
          return { status: "unreachable", log: "" };
        }
        text = await blob.text();
      } else if (response.ok) {
        // Some runtimes auto-follow despite redirect:"manual" — handle a direct 200.
        text = await response.text();
      } else {
        this.logger.warn(
          {
            service: "github-actions",
            repo: env.GITHUB_REPO,
            jobId,
            status: response.status,
          },
          "GitHub job logs fetch returned non-2xx",
        );
        return { status: "unreachable", log: "" };
      }
      // Never log `text` — it can be large and echo build env (R5/R22).
      return { status: "ok", log: truncateLog(text) };
    } catch (error) {
      this.logger.warn(
        {
          service: "github-actions",
          repo: env.GITHUB_REPO,
          jobId,
          error: errMessage(error),
        },
        "GitHub job logs fetch failed",
      );
      return { status: "unreachable", log: "" };
    }
  }

  /** The auth + version + UA headers every GitHub REST call needs. GitHub 403s
   *  any request without a `User-Agent`. */
  private authHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "pombo-admin",
    };
  }

  /** Fetches the latest runs of ONE workflow. Returns `null` on any failure
   *  (non-2xx, timeout, network) so the caller can distinguish all-failed from
   *  partial. Never throws. */
  private async fetchWorkflowRuns(
    file: string,
    workflow: CiWorkflow,
    token: string,
    limit: number,
  ): Promise<CiRun[] | null> {
    const perPage = Math.min(Math.max(1, limit), MAX_PER_PAGE);
    const url = `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${file}/runs?per_page=${perPage}`;
    try {
      const response = await fetch(url, {
        headers: this.authHeaders(token),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(
          {
            service: "github-actions",
            repo: env.GITHUB_REPO,
            workflow: file,
            status: response.status,
          },
          "GitHub Actions runs fetch returned non-2xx",
        );
        return null;
      }
      const body = (await response.json()) as { workflow_runs?: unknown[] };
      return normalizeWorkflowRuns(body.workflow_runs ?? [], workflow);
    } catch (error) {
      this.logger.warn(
        {
          service: "github-actions",
          repo: env.GITHUB_REPO,
          workflow: file,
          error: errMessage(error),
        },
        "GitHub Actions runs fetch failed",
      );
      return null;
    }
  }
}

/**
 * Projects one workflow's raw GitHub `workflow_runs` onto our `CiRun[]`:
 * normalizes status/conclusion, shortens the sha, drops malformed entries.
 * Pure + total — exported for testing. (Cross-workflow sort/slice happens in
 * `listRuns` after the merge.)
 */
export function normalizeWorkflowRuns(
  raw: unknown[],
  workflow: CiWorkflow,
): CiRun[] {
  return raw
    .map((entry) => toCiRun(entry, workflow))
    .filter((run): run is CiRun => run !== null);
}

function toCiRun(raw: unknown, workflow: CiWorkflow): CiRun | null {
  if (!raw || typeof raw !== "object") return null;
  const run = raw as GitHubRun;
  // GitHub always returns a numeric id; guard so a malformed entry can't collide
  // on an empty React key downstream (a missing id would stringify to "").
  const id = run.id != null ? String(run.id) : "";
  if (!id) return null;

  return {
    id,
    workflow,
    title: run.display_title || run.name || "—",
    status: mapStatus(run.status),
    conclusion: mapConclusion(run.conclusion),
    sha:
      typeof run.head_sha === "string" && run.head_sha
        ? run.head_sha.slice(0, 7)
        : "—",
    actor: run.actor?.login ?? "—",
    event: run.event ?? "—",
    runNumber: typeof run.run_number === "number" ? run.run_number : 0,
    createdAt: run.created_at ?? "",
    updatedAt: run.updated_at ?? "",
    url: run.html_url ?? "",
  };
}

function mapStatus(status: unknown): CiRunStatus {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  return "queued"; // queued / requested / waiting / pending / null → queued
}

function mapConclusion(conclusion: unknown): CiRunConclusion {
  switch (conclusion) {
    case "success":
      return "success";
    case "failure":
    case "timed_out":
    case "startup_failure":
      return "failure";
    case "cancelled":
      return "cancelled";
    case "skipped":
      return "skipped";
    case null:
    case undefined:
      return null;
    default:
      return "other"; // neutral, action_required, stale, ...
  }
}

/**
 * Projects GitHub's raw `jobs` array onto our `CiJob[]` (each with its `steps`):
 * normalizes status/conclusion, stringifies ids, drops malformed entries.
 * Pure + total — exported for testing.
 */
export function normalizeJobs(raw: unknown[]): CiJob[] {
  return raw.map(toCiJob).filter((job): job is CiJob => job !== null);
}

function toCiJob(raw: unknown): CiJob | null {
  if (!raw || typeof raw !== "object") return null;
  const job = raw as GitHubJob;
  const id = job.id != null ? String(job.id) : "";
  if (!id) return null;

  return {
    id,
    name: typeof job.name === "string" && job.name ? job.name : "—",
    status: mapStatus(job.status),
    conclusion: mapConclusion(job.conclusion),
    startedAt: job.started_at ?? null,
    completedAt: job.completed_at ?? null,
    steps: Array.isArray(job.steps)
      ? job.steps.map(toCiStep).filter((step): step is CiStep => step !== null)
      : [],
  };
}

function toCiStep(raw: unknown): CiStep | null {
  if (!raw || typeof raw !== "object") return null;
  const step = raw as GitHubStep;
  if (typeof step.name !== "string" || !step.name) return null;

  return {
    name: step.name,
    status: mapStatus(step.status),
    conclusion: mapConclusion(step.conclusion),
    number: typeof step.number === "number" ? step.number : 0,
  };
}

/**
 * Bounds a job's log text to the TAIL (most recent output), capped by lines
 * first then bytes — whichever limit is hit first wins. Prefixes a marker when
 * anything was dropped so the operator knows there's more above. Pure — exported
 * for testing.
 */
export function truncateLog(text: string): string {
  let out = text;
  let truncated = false;

  // Byte-cap FIRST so a multi-MB blob is bounded to the ~256KB tail before we
  // ever split it into a line array — splitting the raw text first would be an
  // unbounded synchronous allocation on a huge log.
  if (Buffer.byteLength(out, "utf8") > LOG_MAX_BYTES) {
    const buf = Buffer.from(out, "utf8");
    let start = buf.length - LOG_MAX_BYTES;
    // Align the start forward to a UTF-8 lead byte so we never slice through a
    // multibyte sequence (which would emit U+FFFD at the boundary).
    while (start < buf.length && (buf[start]! & 0xc0) === 0x80) start++;
    out = buf.subarray(start).toString("utf8");
    truncated = true;
  }

  // Then line-cap on the already byte-bounded tail.
  const lines = out.split("\n");
  if (lines.length > LOG_MAX_LINES) {
    out = lines.slice(lines.length - LOG_MAX_LINES).join("\n");
    truncated = true;
  }

  return truncated
    ? `[… log truncado — exibindo o trecho mais recente]\n${out}`
    : out;
}
