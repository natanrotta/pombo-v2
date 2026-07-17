/**
 * Why a host scrape did not return metrics. Lets the admin panel tell the
 * operator *which* problem to fix instead of a generic "offline":
 * - `not_configured`: no URL is set (the `METRICS_*_URL` env var is empty).
 * - `unreachable`: a URL is set but the scrape failed (timeout, network
 *   error, non-2xx, or unparseable body) — agent down or tunnel closed.
 */
export type NodeExporterUnreachableReason = "not_configured" | "unreachable";

/**
 * Host metrics scraped from a Prometheus `node_exporter` agent. When the
 * agent is not configured (no URL) or unreachable / times out / fails to
 * parse, the snapshot degrades to `{ reachable: false, reason }` with no
 * metric fields — `reason` distinguishes "env not set" from "agent down".
 */
export interface NodeExporterHostMetrics {
  reachable: boolean;
  /** Present only when `reachable` is false — why the scrape yielded nothing. */
  reason?: NodeExporterUnreachableReason;
  memTotalBytes?: number;
  memAvailableBytes?: number;
  diskSizeBytes?: number;
  diskAvailBytes?: number;
  load1?: number;
  load5?: number;
  load15?: number;
  cpuCount?: number;
  uptimeSeconds?: number;
}

/**
 * Port over a `node_exporter` scrape. The infrastructure adapter owns the
 * actual URLs (from env) so the application layer stays free of config
 * imports. `fetchHost` is the unit-testable seam; `fetchApp` / `fetchData`
 * resolve the configured URLs and delegate to it.
 */
export interface INodeExporterMetricsProvider {
  /** Scrape an explicit node_exporter `/metrics` URL. `undefined` →
   *  `{ reachable: false }`. Never throws. */
  fetchHost(url?: string): Promise<NodeExporterHostMetrics>;
  /** Scrape the APP host (env `METRICS_APP_URL`). */
  fetchApp(): Promise<NodeExporterHostMetrics>;
  /** Scrape the DATA host (env `METRICS_DATA_URL`). */
  fetchData(): Promise<NodeExporterHostMetrics>;
}
