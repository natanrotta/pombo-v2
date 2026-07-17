import { vi } from "vitest";
import pino from "pino";

vi.mock("../config", () => ({
  env: { LOG_LEVEL: "info", NODE_ENV: "test" },
}));

import { redactPaths, pathOnly } from "./logger";

describe("logger redact paths", () => {
  it("mirrors every sensitive path under both req.* and request.*", () => {
    // The customProps block emits the request under `request.*`; without the
    // mirror, fast-redact (exact-path) would miss them. This is the SEC-C7 leak.
    for (const path of [
      "req.headers.authorization",
      "request.headers.authorization",
      "req.headers.cookie",
      "request.headers.cookie",
      'req.headers["x-csrf-token"]',
      'request.headers["x-csrf-token"]',
      "req.body.summary",
      "request.body.summary",
      "req.body.transcription",
      "request.body.transcription",
      "req.body.fieldValues",
      "request.body.fieldValues",
      "req.body.password",
      "request.body.password",
      "req.body.access_token",
      "request.body.access_token",
    ]) {
      expect(redactPaths).toContain(path);
    }
  });

  it("functionally redacts credentials + PHI in a customProps-shaped record", () => {
    let line = "";
    const sink = pino(
      { redact: { paths: redactPaths, censor: "[REDACTED]" } },
      { write: (s: string) => (line = s) },
    );

    sink.warn({
      request: {
        method: "POST",
        url: "/patients",
        headers: {
          authorization: "Bearer super-secret-jwt",
          cookie: "boilerplate_rt=abc",
        },
        body: {
          summary: "patient PHI summary",
          transcription: "clinical text",
          password: "p@ss",
        },
      },
    });

    const parsed = JSON.parse(line);
    expect(parsed.request.headers.authorization).toBe("[REDACTED]");
    expect(parsed.request.headers.cookie).toBe("[REDACTED]");
    expect(parsed.request.body.summary).toBe("[REDACTED]");
    expect(parsed.request.body.transcription).toBe("[REDACTED]");
    expect(parsed.request.body.password).toBe("[REDACTED]");
    expect(line).not.toContain("super-secret-jwt");
    expect(line).not.toContain("patient PHI summary");
    expect(line).not.toContain("clinical text");
  });
});

describe("pathOnly", () => {
  it("strips the query string (PHI/token) from a URL", () => {
    expect(pathOnly("/patients?search=Jo%C3%A3o+Silva")).toBe("/patients");
    expect(pathOnly("/imports/stream?access_token=secret")).toBe(
      "/imports/stream",
    );
  });

  it("returns the path unchanged when there is no query", () => {
    expect(pathOnly("/health")).toBe("/health");
  });

  it("handles undefined", () => {
    expect(pathOnly(undefined)).toBeUndefined();
  });
});
