import "reflect-metadata";

vi.mock("../../config", () => ({
  env: {
    METRICS_APP_URL: "http://10.8.0.1:9100/metrics",
    METRICS_DATA_URL: undefined,
  },
}));

import { ILoggerProvider } from "@shared/provider";
import {
  NodeExporterMetricsProvider,
  parsePrometheusHostMetrics,
} from "./node-exporter-metrics.provider";

const mockLogger: ILoggerProvider = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const SAMPLE_METRICS = `
# HELP node_memory_MemTotal_bytes Memory information field MemTotal_bytes.
# TYPE node_memory_MemTotal_bytes gauge
node_memory_MemTotal_bytes 8.388608e+09
# TYPE node_memory_MemAvailable_bytes gauge
node_memory_MemAvailable_bytes 4194304000
# TYPE node_filesystem_size_bytes gauge
node_filesystem_size_bytes{device="/dev/sda1",fstype="ext4",mountpoint="/boot"} 1.0e+08
node_filesystem_size_bytes{device="/dev/sda2",fstype="ext4",mountpoint="/"} 5.0e+10
node_filesystem_avail_bytes{device="/dev/sda1",fstype="ext4",mountpoint="/boot"} 5.0e+07
node_filesystem_avail_bytes{device="/dev/sda2",fstype="ext4",mountpoint="/"} 2.5e+10
# TYPE node_load1 gauge
node_load1 0.42
node_load5 0.31
node_load15 0.20
# TYPE node_cpu_seconds_total counter
node_cpu_seconds_total{cpu="0",mode="idle"} 12345.6
node_cpu_seconds_total{cpu="0",mode="user"} 100.0
node_cpu_seconds_total{cpu="1",mode="idle"} 23456.7
node_cpu_seconds_total{cpu="1",mode="user"} 200.0
# TYPE node_time_seconds gauge
node_time_seconds 1.7e+09
# TYPE node_boot_time_seconds gauge
node_boot_time_seconds 1.6999e+09
`;

describe("parsePrometheusHostMetrics", () => {
  it("extracts every host gauge from a node_exporter body", () => {
    const result = parsePrometheusHostMetrics(SAMPLE_METRICS);

    expect(result.reachable).toBe(true);
    expect(result.memTotalBytes).toBe(8.388608e9);
    expect(result.memAvailableBytes).toBe(4194304000);
    // disk picks the mountpoint="/" series, not "/boot"
    expect(result.diskSizeBytes).toBe(5.0e10);
    expect(result.diskAvailBytes).toBe(2.5e10);
    expect(result.load1).toBe(0.42);
    expect(result.load5).toBe(0.31);
    expect(result.load15).toBe(0.2);
    // one idle series per logical core
    expect(result.cpuCount).toBe(2);
    // uptime = node_time_seconds - node_boot_time_seconds
    expect(result.uptimeSeconds).toBe(Math.round(1.7e9 - 1.6999e9));
  });

  it("stays reachable but omits fields that are absent", () => {
    const result = parsePrometheusHostMetrics("node_load1 1.5\n");

    expect(result.reachable).toBe(true);
    expect(result.load1).toBe(1.5);
    expect(result.memTotalBytes).toBeUndefined();
    expect(result.cpuCount).toBeUndefined();
    expect(result.uptimeSeconds).toBeUndefined();
  });
});

describe("NodeExporterMetricsProvider", () => {
  let sut: NodeExporterMetricsProvider;
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    sut = new NodeExporterMetricsProvider(mockLogger);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("fetchHost", () => {
    it("returns reachable:false with reason not_configured when no URL is provided", async () => {
      const result = await sut.fetchHost(undefined);

      expect(result).toEqual({ reachable: false, reason: "not_configured" });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("scrapes and parses a successful response", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(SAMPLE_METRICS),
      });

      const result = await sut.fetchHost("http://host:9100/metrics");

      expect(result.reachable).toBe(true);
      expect(result.cpuCount).toBe(2);
    });

    it("returns reachable:false with reason unreachable on a non-2xx response", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve(""),
      });

      const result = await sut.fetchHost("http://host:9100/metrics");

      expect(result).toEqual({ reachable: false, reason: "unreachable" });
    });

    it("returns reachable:false with reason unreachable on a network error / timeout", async () => {
      fetchMock.mockRejectedValue(
        new Error("The operation was aborted due to timeout"),
      );

      const result = await sut.fetchHost("http://host:9100/metrics");

      expect(result).toEqual({ reachable: false, reason: "unreachable" });
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe("fetchApp / fetchData", () => {
    it("fetchApp uses the configured METRICS_APP_URL", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(SAMPLE_METRICS),
      });

      await sut.fetchApp();

      expect(fetchMock).toHaveBeenCalledWith(
        "http://10.8.0.1:9100/metrics",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it("fetchData returns reachable:false (not_configured) when METRICS_DATA_URL is unset", async () => {
      const result = await sut.fetchData();

      expect(result).toEqual({ reachable: false, reason: "not_configured" });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
