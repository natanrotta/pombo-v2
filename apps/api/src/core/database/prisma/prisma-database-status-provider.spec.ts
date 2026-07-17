import "reflect-metadata";

const mockQueryRaw = vi.fn();

vi.mock("./prisma-client", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

import { ILoggerProvider } from "@shared/provider";
import { PrismaDatabaseStatusProvider } from "./prisma-database-status-provider";

const mockLogger: ILoggerProvider = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

/**
 * The provider fires five `$queryRaw` probes in a fixed order via `Promise.all`:
 * 1) version, 2) pg_database_size, 3) pg_stat_activity count,
 * 4) pgvector extversion, 5) last `_prisma_migrations` row.
 */
function stubHappyProbes(
  migrationFinishedAt: Date | null = new Date("2026-06-01T12:00:00.000Z"),
) {
  mockQueryRaw
    .mockResolvedValueOnce([
      { version: "PostgreSQL 16.3 on x86_64-pc-linux-gnu" },
    ])
    .mockResolvedValueOnce([{ size: 134217728n }])
    .mockResolvedValueOnce([{ count: 7n }])
    .mockResolvedValueOnce([{ extversion: "0.7.0" }])
    .mockResolvedValueOnce([
      {
        migration_name: "20260601_add_admin_status",
        finished_at: migrationFinishedAt,
      },
    ]);
}

describe("PrismaDatabaseStatusProvider", () => {
  let sut: PrismaDatabaseStatusProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new PrismaDatabaseStatusProvider(mockLogger);
  });

  describe("getStatus — happy path", () => {
    it("maps every probe into a reachable:true snapshot", async () => {
      stubHappyProbes();

      const result = await sut.getStatus();

      expect(result).toEqual({
        reachable: true,
        version: "PostgreSQL 16.3 on x86_64-pc-linux-gnu",
        pgvector: "0.7.0",
        sizeBytes: 134217728,
        activeConnections: 7,
        lastMigration: {
          name: "20260601_add_admin_status",
          appliedAt: "2026-06-01T12:00:00.000Z",
        },
      });
      expect(mockQueryRaw).toHaveBeenCalledTimes(5);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it("coerces bigint size/count into numbers", async () => {
      stubHappyProbes();

      const result = await sut.getStatus();

      expect(typeof result.sizeBytes).toBe("number");
      expect(typeof result.activeConnections).toBe("number");
    });

    it("reports pgvector:null when the extension is absent", async () => {
      mockQueryRaw
        .mockResolvedValueOnce([{ version: "PostgreSQL 16.3" }])
        .mockResolvedValueOnce([{ size: 1024n }])
        .mockResolvedValueOnce([{ count: 1n }])
        .mockResolvedValueOnce([]) // no pgvector row
        .mockResolvedValueOnce([]); // no migration row

      const result = await sut.getStatus();

      expect(result.reachable).toBe(true);
      expect(result.pgvector).toBeNull();
      expect(result.lastMigration).toBeNull();
    });

    it("returns lastMigration:null when the last migration has no finished_at", async () => {
      stubHappyProbes(null);

      const result = await sut.getStatus();

      expect(result.reachable).toBe(true);
      expect(result.lastMigration).toBeNull();
    });
  });

  describe("getStatus — graceful degradation (AC3)", () => {
    it("returns reachable:false and logs a warning when a probe rejects", async () => {
      mockQueryRaw.mockRejectedValue(new Error("connection refused"));

      const result = await sut.getStatus();

      expect(result).toEqual({ reachable: false });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          service: "postgres",
          error: "connection refused",
        }),
        "Postgres status probe failed",
      );
    });

    it("never throws even on a non-Error rejection value", async () => {
      mockQueryRaw.mockRejectedValue("db is down");

      const result = await sut.getStatus();

      expect(result).toEqual({ reachable: false });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ service: "postgres", error: "db is down" }),
        "Postgres status probe failed",
      );
    });
  });
});
