import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import {
  IDatabaseStatusProvider,
  DatabaseStatus,
  ILoggerProvider,
} from "@shared/provider";
import { prisma } from "./prisma-client";

/**
 * Read-only Postgres health probes for the admin system-status panel. Every
 * value comes from a cheap `$queryRaw` against catalog/admin views — server
 * version, database size, active connections, the `pgvector` extension
 * version, and the last applied migration.
 *
 * Hard rule: this never throws. Any failure (DB down, permission, parse) is
 * swallowed into `{ reachable: false }` so a DB hiccup cannot 500 the status
 * endpoint. It also never exposes connection strings or credentials — only
 * operational numbers.
 */
@injectable()
export class PrismaDatabaseStatusProvider implements IDatabaseStatusProvider {
  constructor(
    @inject(DI_TOKENS.LoggerProvider) private readonly logger: ILoggerProvider,
  ) {}

  async getStatus(): Promise<DatabaseStatus> {
    try {
      const [versionRows, sizeRows, connRows, pgvectorRows, migrationRows] =
        await Promise.all([
          prisma.$queryRaw<
            Array<{ version: string }>
          >`SELECT version() AS version`,
          prisma.$queryRaw<Array<{ size: bigint }>>`
          SELECT pg_database_size(current_database()) AS size`,
          prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT count(*) AS count FROM pg_stat_activity`,
          prisma.$queryRaw<Array<{ extversion: string }>>`
          SELECT extversion FROM pg_extension WHERE extname = 'vector' LIMIT 1`,
          prisma.$queryRaw<
            Array<{ migration_name: string; finished_at: Date | null }>
          >`
          SELECT migration_name, finished_at
          FROM _prisma_migrations
          ORDER BY finished_at DESC NULLS LAST
          LIMIT 1`,
        ]);

      const lastMigration = migrationRows[0];

      return {
        reachable: true,
        version: versionRows[0]?.version,
        pgvector: pgvectorRows[0]?.extversion ?? null,
        sizeBytes: sizeRows[0] ? Number(sizeRows[0].size) : undefined,
        activeConnections: connRows[0] ? Number(connRows[0].count) : undefined,
        lastMigration:
          lastMigration && lastMigration.finished_at
            ? {
                name: lastMigration.migration_name,
                appliedAt: lastMigration.finished_at.toISOString(),
              }
            : null,
      };
    } catch (error) {
      this.logger.warn(
        {
          service: "postgres",
          error: error instanceof Error ? error.message : String(error),
        },
        "Postgres status probe failed",
      );
      return { reachable: false };
    }
  }
}
