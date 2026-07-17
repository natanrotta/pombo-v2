import "reflect-metadata";

vi.mock("../../config", () => ({
  env: {
    GITHUB_ACTIONS_TOKEN: "tok-123",
    GITHUB_REPO: "OWNER/REPO",
  },
}));

import { env } from "../../config";
import {
  GitHubActionsCiProvider,
  normalizeWorkflowRuns,
  normalizeJobs,
  truncateLog,
} from "./github-actions-ci.provider";
import { ILoggerProvider } from "@shared/provider";

const mockLogger: ILoggerProvider = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

function rawRun(over: Record<string, unknown> = {}) {
  return {
    id: 10,
    name: "Build API image (GHCR)",
    display_title: "feat: x",
    head_sha: "abcdef1234567",
    status: "completed",
    conclusion: "success",
    run_number: 7,
    event: "push",
    created_at: "2026-06-19T10:00:00Z",
    updated_at: "2026-06-19T10:05:00Z",
    html_url: "https://github.com/OWNER/REPO/actions/runs/10",
    actor: { login: "natan" },
    ...over,
  };
}

describe("normalizeWorkflowRuns", () => {
  it("maps each raw run onto the given workflow, normalizing fields", () => {
    const [run] = normalizeWorkflowRuns([rawRun()], "build");
    expect(run).toEqual({
      id: "10",
      workflow: "build",
      title: "feat: x",
      status: "completed",
      conclusion: "success",
      sha: "abcdef1",
      actor: "natan",
      event: "push",
      runNumber: 7,
      createdAt: "2026-06-19T10:00:00Z",
      updatedAt: "2026-06-19T10:05:00Z",
      url: "https://github.com/OWNER/REPO/actions/runs/10",
    });
  });

  it("collapses timed_out → failure, unknown → other, in-progress → null conclusion", () => {
    expect(
      normalizeWorkflowRuns([rawRun({ conclusion: "timed_out" })], "deploy")[0]!
        .conclusion,
    ).toBe("failure");
    expect(
      normalizeWorkflowRuns([rawRun({ conclusion: "neutral" })], "deploy")[0]!
        .conclusion,
    ).toBe("other");
    expect(
      normalizeWorkflowRuns(
        [rawRun({ status: "in_progress", conclusion: null })],
        "deploy",
      )[0]!.conclusion,
    ).toBe(null);
    expect(
      normalizeWorkflowRuns(
        [rawRun({ status: "in_progress", conclusion: null })],
        "deploy",
      )[0]!.status,
    ).toBe("in_progress");
  });

  it("drops malformed entries and entries without an id (no empty-key collisions)", () => {
    expect(
      normalizeWorkflowRuns([null, 42, {}, rawRun({ id: undefined })], "build"),
    ).toEqual([]);
  });
});

function rawJob(over: Record<string, unknown> = {}) {
  return {
    id: 99,
    name: "Build & push image (GHCR)",
    status: "completed",
    conclusion: "success",
    started_at: "2026-06-20T10:00:00Z",
    completed_at: "2026-06-20T10:05:00Z",
    steps: [
      {
        name: "Resolver próxima versão",
        status: "completed",
        conclusion: "success",
        number: 1,
      },
      {
        name: "Criar tag da release",
        status: "in_progress",
        conclusion: null,
        number: 2,
      },
    ],
    ...over,
  };
}

describe("normalizeJobs", () => {
  it("maps jobs + steps, stringifies ids, normalizes status/conclusion", () => {
    const [job] = normalizeJobs([rawJob()]);
    expect(job).toEqual({
      id: "99",
      name: "Build & push image (GHCR)",
      status: "completed",
      conclusion: "success",
      startedAt: "2026-06-20T10:00:00Z",
      completedAt: "2026-06-20T10:05:00Z",
      steps: [
        {
          name: "Resolver próxima versão",
          status: "completed",
          conclusion: "success",
          number: 1,
        },
        {
          name: "Criar tag da release",
          status: "in_progress",
          conclusion: null,
          number: 2,
        },
      ],
    });
  });

  it("drops malformed jobs and tolerates a missing steps array", () => {
    const jobs = normalizeJobs([
      null,
      42,
      {},
      rawJob({ id: undefined }),
      rawJob({ id: 5, steps: undefined }),
    ]);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]!.id).toBe("5");
    expect(jobs[0]!.steps).toEqual([]);
  });
});

describe("truncateLog", () => {
  it("keeps a short log intact", () => {
    expect(truncateLog("linha a\nlinha b")).toBe("linha a\nlinha b");
  });

  it("keeps only the last 500 lines and prefixes a truncation marker", () => {
    const text = Array.from({ length: 600 }, (_, i) => `linha-${i}`).join("\n");
    const out = truncateLog(text);
    expect(out.startsWith("[… log truncado")).toBe(true);
    expect(out).toContain("linha-599");
    expect(out).not.toContain("linha-0\n");
  });

  it("caps by bytes (>256KB) without splitting a multibyte char", () => {
    // 'é' is 2 bytes — 200k of them = ~400KB on a single line, so the byte cap
    // (not the line cap) fires; the boundary must align to a code point.
    const out = truncateLog("é".repeat(200_000));
    expect(out.startsWith("[… log truncado")).toBe(true);
    expect(out).not.toContain("�"); // no replacement char at the boundary
    expect(Buffer.byteLength(out, "utf8")).toBeLessThanOrEqual(256 * 1024 + 64);
  });

  it("applies BOTH caps in order (byte-cap first, then line-cap on the tail)", () => {
    // 2000 lines × ~200 bytes = ~400KB → byte-cap trims to the 256KB tail first,
    // which still has >500 lines, so the line-cap then trims that to 500.
    const line = "y".repeat(200);
    const text = Array.from({ length: 2000 }, (_, i) => `${i}-${line}`).join(
      "\n",
    );
    const out = truncateLog(text);
    expect(out.startsWith("[… log truncado")).toBe(true);
    expect(Buffer.byteLength(out, "utf8")).toBeLessThanOrEqual(256 * 1024 + 64);
    expect(out.split("\n").length).toBeLessThanOrEqual(501); // 500-line cap + 1 marker line
    expect(out).toContain("1999-"); // the newest line survives (tail kept)
  });
});

describe("GitHubActionsCiProvider", () => {
  let sut: GitHubActionsCiProvider;
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (env as { GITHUB_ACTIONS_TOKEN?: string }).GITHUB_ACTIONS_TOKEN = "tok-123";
    vi.stubGlobal("fetch", fetchMock);
    sut = new GitHubActionsCiProvider(mockLogger);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns not_configured (no fetch) when the token is unset", async () => {
    (env as { GITHUB_ACTIONS_TOKEN?: string }).GITHUB_ACTIONS_TOKEN = undefined;

    const result = await sut.listRuns(20);

    expect(result).toEqual({ status: "not_configured", runs: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches each workflow with auth + User-Agent, merges and sorts newest-first", async () => {
    fetchMock.mockImplementation((url: string) => {
      const isBuild = url.includes("build-api.yml");
      const run = rawRun(
        isBuild
          ? { id: 10, created_at: "2026-06-19T10:00:00Z" }
          : { id: 11, created_at: "2026-06-19T11:00:00Z" },
      );
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ workflow_runs: [run] }),
      });
    });

    const result = await sut.listRuns(20);

    expect(result.status).toBe("ok");
    expect(result.runs.map((r) => r.id)).toEqual(["11", "10"]); // deploy (newer) first
    expect(result.runs.map((r) => r.workflow)).toEqual(["deploy", "build"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/actions/workflows/build-api.yml/runs"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer tok-123",
          "User-Agent": "boilerplate-admin",
        }),
        signal: expect.any(AbortSignal),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/actions/workflows/deploy-api.yml/runs"),
      expect.anything(),
    );
  });

  it("returns unreachable + logs when ALL workflow calls fail (non-2xx)", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });

    const result = await sut.listRuns(20);

    expect(result).toEqual({ status: "unreachable", runs: [] });
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("returns unreachable when ALL workflow calls reject (network / timeout)", async () => {
    fetchMock.mockRejectedValue(
      new Error("The operation was aborted due to timeout"),
    );

    const result = await sut.listRuns(20);

    expect(result).toEqual({ status: "unreachable", runs: [] });
  });

  it("degrades to ok with partial data when only one workflow call fails", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("build-api.yml")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ workflow_runs: [rawRun({ id: 10 })] }),
        });
      }
      return Promise.reject(new Error("deploy workflow blip"));
    });

    const result = await sut.listRuns(20);

    expect(result.status).toBe("ok");
    expect(result.runs).toHaveLength(1);
    expect(result.runs[0]!.workflow).toBe("build");
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  describe("getRunSteps", () => {
    it("fetches the run jobs with auth + UA and normalizes jobs+steps", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ jobs: [rawJob()] }),
      });

      const result = await sut.getRunSteps("123");

      expect(result.status).toBe("ok");
      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0]!.steps).toHaveLength(2);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/actions/runs/123/jobs"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer tok-123",
            "User-Agent": "boilerplate-admin",
          }),
        }),
      );
    });

    it("returns unreachable + logs on non-2xx", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 404 });
      expect(await sut.getRunSteps("123")).toEqual({
        status: "unreachable",
        jobs: [],
      });
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("returns unreachable on a network error / timeout (rejection)", async () => {
      fetchMock.mockRejectedValue(
        new Error("The operation was aborted due to timeout"),
      );
      expect(await sut.getRunSteps("123")).toEqual({
        status: "unreachable",
        jobs: [],
      });
    });

    it("returns not_configured (no fetch) when the token is unset", async () => {
      (env as { GITHUB_ACTIONS_TOKEN?: string }).GITHUB_ACTIONS_TOKEN =
        undefined;
      expect(await sut.getRunSteps("123")).toEqual({
        status: "not_configured",
        jobs: [],
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("getJobLogs", () => {
    it("follows the 302 to the blob (NO auth header) and returns truncated text", async () => {
      fetchMock
        .mockResolvedValueOnce({
          status: 302,
          headers: { get: () => "https://blob.example/logs" },
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve("linha a\nlinha b"),
        });

      const result = await sut.getJobLogs("555");

      expect(result).toEqual({ status: "ok", log: "linha a\nlinha b" });
      // The signed blob URL must be fetched WITHOUT our PAT.
      const blobCall = fetchMock.mock.calls[1]!;
      expect(blobCall[0]).toBe("https://blob.example/logs");
      expect((blobCall[1] as { headers?: unknown })?.headers).toBeUndefined();
    });

    it("handles a direct 200 (runtime auto-followed the redirect)", async () => {
      fetchMock.mockResolvedValue({
        status: 200,
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve("direct logs"),
      });
      expect(await sut.getJobLogs("1")).toEqual({
        status: "ok",
        log: "direct logs",
      });
    });

    it("returns ok with empty log on 404 (job hasn't produced logs yet)", async () => {
      fetchMock.mockResolvedValue({
        status: 404,
        headers: { get: () => null },
      });
      expect(await sut.getJobLogs("1")).toEqual({ status: "ok", log: "" });
    });

    it("returns unreachable + logs on other non-2xx", async () => {
      fetchMock.mockResolvedValue({
        status: 500,
        ok: false,
        headers: { get: () => null },
      });
      expect(await sut.getJobLogs("1")).toEqual({
        status: "unreachable",
        log: "",
      });
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("returns not_configured (no fetch) when the token is unset", async () => {
      (env as { GITHUB_ACTIONS_TOKEN?: string }).GITHUB_ACTIONS_TOKEN =
        undefined;
      expect(await sut.getJobLogs("1")).toEqual({
        status: "not_configured",
        log: "",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
