import { Client } from "pg";
import type { ILoggerProvider } from "@shared/provider/logger-provider.interface";

// A fixed 64-bit key shared by EVERY pombo instance — a second instance
// computes the SAME key and fails to acquire, guaranteeing exactly one replica
// owns the live WhatsApp sockets (two replicas sharing the authState would
// corrupt the Signal keys). Deliberately NOT an env var.
const LOCK_KEY = 483_279_687_279;
const DEFAULT_HEARTBEAT_MS = 30_000;

export interface AdvisoryLock {
  acquire(): Promise<boolean>;
  release(): Promise<void>;
}

export interface AdvisoryLockDeps {
  connectionString: string;
  logger: ILoggerProvider;
  /** Called if the connection drops AFTER we acquired — the lock may already be
   *  gone, so the holder can no longer trust the single-replica guarantee. */
  onLost?: () => void;
  key?: number;
  heartbeatMs?: number;
}

/**
 * Postgres SESSION-level advisory lock, held on a DEDICATED pg connection —
 * never Prisma's pool (whose connections are reused and returned, silently
 * releasing the lock). The lock auto-releases if the process dies (the TCP
 * session drops). `pg` is a direct dependency of `@prisma/adapter-pg`, so this
 * driver is already present — this is the one place the raw driver is used.
 */
export const makeAdvisoryLock = (deps: AdvisoryLockDeps): AdvisoryLock => {
  const key = deps.key ?? LOCK_KEY;
  const client = new Client({
    connectionString: deps.connectionString,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  });
  let held = false;
  let heartbeat: NodeJS.Timeout | undefined;

  const onConnectionLost = (context: string): void => {
    if (!held) return;
    held = false;
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = undefined;
    }
    deps.logger.error(
      { context },
      "advisory lock connection lost — single-replica guarantee void",
    );
    deps.onLost?.();
  };

  return {
    async acquire(): Promise<boolean> {
      await client.connect();

      // Attach the drop detectors BEFORE the lock query so the pg Client never
      // emits an UNHANDLED 'error'. They're gated on `held`, so they only fire
      // onLost once we actually hold the lock.
      client.on("error", (error) => {
        deps.logger.error(
          { message: error.message },
          "advisory lock client error",
        );
        onConnectionLost("client-error");
      });
      client.on("end", () => onConnectionLost("client-end"));

      let locked = false;
      try {
        const result = await client.query<{ locked: boolean }>(
          "SELECT pg_try_advisory_lock($1) AS locked",
          [key],
        );
        locked = result.rows[0]?.locked ?? false;
      } catch (error) {
        await client.end().catch(() => {});
        throw error;
      }

      if (!locked) {
        await client.end();
        return false;
      }

      held = true;
      heartbeat = setInterval(() => {
        client.query("SELECT 1").catch(() => onConnectionLost("heartbeat"));
      }, deps.heartbeatMs ?? DEFAULT_HEARTBEAT_MS);
      heartbeat.unref();
      return true;
    },

    async release(): Promise<void> {
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = undefined;
      }
      if (!held) {
        await client.end().catch(() => {});
        return;
      }
      held = false;
      try {
        await client.query("SELECT pg_advisory_unlock($1)", [key]);
      } catch (error) {
        deps.logger.error(
          {
            message: error instanceof Error ? error.message : String(error),
          },
          "advisory unlock failed",
        );
      } finally {
        await client.end().catch(() => {});
      }
    },
  };
};
