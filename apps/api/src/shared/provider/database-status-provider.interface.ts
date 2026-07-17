/** Most recent applied migration row. */
export interface DatabaseLastMigration {
  name: string;
  appliedAt: string;
}

/**
 * Health snapshot of the Postgres database, read via lightweight `$queryRaw`
 * probes (server version, database size, active connections, pgvector
 * extension version, last applied migration). Degrades to
 * `{ reachable: false }` on any failure — a DB hiccup must never 500 the
 * status endpoint.
 */
export interface DatabaseStatus {
  reachable: boolean;
  version?: string;
  pgvector?: string | null;
  sizeBytes?: number;
  activeConnections?: number;
  lastMigration?: DatabaseLastMigration | null;
}

/**
 * Port over the read-only Postgres health probes used by the admin
 * system-status panel. Lives behind a port so the application layer never
 * imports the Prisma client directly (Domain ← Application ← Infrastructure).
 */
export interface IDatabaseStatusProvider {
  /** Never throws — any failure yields `{ reachable: false }`. */
  getStatus(): Promise<DatabaseStatus>;
}
