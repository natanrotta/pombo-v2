import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import {
  INodeExporterMetricsProvider,
  NodeExporterHostMetrics,
  ILoggerProvider,
} from "@shared/provider";
import { env } from "../../config";

/** How long we wait for a node_exporter scrape before giving up. The agent is
 *  on the WireGuard LAN, so this is generous; a slow host degrades the panel,
 *  never the endpoint. */
const SCRAPE_TIMEOUT_MS = 2000;

/**
 * Scrapes a Prometheus `node_exporter` `/metrics` endpoint and projects the
 * handful of host gauges the admin panel renders (memory, disk on `/`, load
 * average, cpu core count, uptime). Uses the native Node 22 `fetch` with an
 * `AbortSignal.timeout` — no axios, no new dependency.
 *
 * Degradation is total and silent: a missing URL, a network error, a non-2xx
 * response, a timeout, or an unparseable body all yield `{ reachable: false }`.
 */
@injectable()
export class NodeExporterMetricsProvider implements INodeExporterMetricsProvider {
  constructor(
    @inject(DI_TOKENS.LoggerProvider) private readonly logger: ILoggerProvider,
  ) {}

  fetchApp(): Promise<NodeExporterHostMetrics> {
    return this.fetchHost(env.METRICS_APP_URL);
  }

  fetchData(): Promise<NodeExporterHostMetrics> {
    return this.fetchHost(env.METRICS_DATA_URL);
  }

  async fetchHost(url?: string): Promise<NodeExporterHostMetrics> {
    // No URL configured: this is an ops gap (the env var is empty), not an
    // outage. Surface it as `not_configured` so the panel shows the right hint.
    if (!url) return { reachable: false, reason: "not_configured" };

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS),
      });
      if (!response.ok) {
        return { reachable: false, reason: "unreachable" };
      }
      const text = await response.text();
      return parsePrometheusHostMetrics(text);
    } catch (error) {
      this.logger.warn(
        {
          service: "node-exporter",
          url,
          error: error instanceof Error ? error.message : String(error),
        },
        "node_exporter scrape failed",
      );
      // A URL is set but the scrape failed: agent down or tunnel closed.
      return { reachable: false, reason: "unreachable" };
    }
  }
}

/**
 * Parses the small set of host gauges out of a node_exporter exposition body.
 * Pure and total — any individual field that cannot be found is simply omitted,
 * but the host is still `reachable: true` (the scrape itself succeeded).
 */
export function parsePrometheusHostMetrics(
  text: string,
): NodeExporterHostMetrics {
  const memTotalBytes = matchGauge(text, "node_memory_MemTotal_bytes");
  const memAvailableBytes = matchGauge(text, "node_memory_MemAvailable_bytes");
  const diskSizeBytes = matchGaugeWithMountRoot(
    text,
    "node_filesystem_size_bytes",
  );
  const diskAvailBytes = matchGaugeWithMountRoot(
    text,
    "node_filesystem_avail_bytes",
  );
  const load1 = matchGauge(text, "node_load1");
  const load5 = matchGauge(text, "node_load5");
  const load15 = matchGauge(text, "node_load15");
  const cpuCount = countIdleCpuSeries(text);
  const timeSeconds = matchGauge(text, "node_time_seconds");
  const bootTimeSeconds = matchGauge(text, "node_boot_time_seconds");
  const uptimeSeconds =
    timeSeconds !== null && bootTimeSeconds !== null
      ? Math.max(0, Math.round(timeSeconds - bootTimeSeconds))
      : null;

  return {
    reachable: true,
    ...(memTotalBytes !== null && { memTotalBytes }),
    ...(memAvailableBytes !== null && { memAvailableBytes }),
    ...(diskSizeBytes !== null && { diskSizeBytes }),
    ...(diskAvailBytes !== null && { diskAvailBytes }),
    ...(load1 !== null && { load1 }),
    ...(load5 !== null && { load5 }),
    ...(load15 !== null && { load15 }),
    ...(cpuCount !== null && { cpuCount }),
    ...(uptimeSeconds !== null && { uptimeSeconds }),
  };
}

/** Matches a metric line with no (or irrelevant) labels: `name value`. */
function matchGauge(text: string, metric: string): number | null {
  const match = text.match(
    new RegExp(`^${escapeRegExp(metric)}(?:\\{[^}]*\\})?\\s+(${NUMBER})`, "m"),
  );
  return match?.[1] !== undefined ? toFiniteNumber(match[1]) : null;
}

/** Matches a labelled gauge whose label set includes `mountpoint="/"`. */
function matchGaugeWithMountRoot(text: string, metric: string): number | null {
  const lines = text.split("\n");
  for (const line of lines) {
    if (!line.startsWith(metric + "{")) continue;
    const labelMatch = line.match(/\{([^}]*)\}\s+(\S+)/);
    if (!labelMatch) continue;
    if (!/mountpoint="\/"/.test(labelMatch[1]!)) continue;
    return toFiniteNumber(labelMatch[2]!);
  }
  return null;
}

/** CPU core count = number of distinct `node_cpu_seconds_total` series with
 *  `mode="idle"` (one per logical core). */
function countIdleCpuSeries(text: string): number | null {
  const lines = text.split("\n");
  let count = 0;
  for (const line of lines) {
    if (
      line.startsWith("node_cpu_seconds_total{") &&
      /mode="idle"/.test(line)
    ) {
      count += 1;
    }
  }
  return count > 0 ? count : null;
}

// Prometheus numeric values may be integers, decimals, scientific notation,
// or the sentinels +Inf/-Inf/NaN (which we reject as null).
const NUMBER = "[-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?Inf|NaN";

function toFiniteNumber(raw: string): number | null {
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
