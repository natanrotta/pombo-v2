/**
 * Preflight check — verifies the local environment is ready for E2E tests.
 *
 * Runs once from `global.setup.ts` before the auth handshake so the failure
 * mode is a clear, actionable error instead of a 15-second timeout on the
 * sign-in page.
 *
 * Important: this check is **rate-limit safe**. It hits `/healthz` (public,
 * no auth) instead of `/auth/sign-in`. The sign-in flow itself is rate-
 * limited (`authRateLimit`); calling it here on every run would burn the
 * suite's allowance after a handful of iterations.
 *
 * What it covers:
 *   1. Web dev server reachable on the baseURL.
 *   2. API process reachable (responds to /healthz).
 *
 * What it does NOT cover (deferred to global.setup.ts's actual login):
 *   - Seed account exists / password matches. If it doesn't, the UI login
 *     fails with a normal error message that's already self-explanatory.
 */

// Defaults point at the isolated E2E stack from `yarn e2e` (root):
// web on :3001, API on :3334. Override via env to test against staging.
const WEB_BASE_URL = process.env.E2E_WEB_URL ?? "http://localhost:3001";
const API_HEALTH_URL = process.env.E2E_API_HEALTH_URL ?? "http://localhost:3334/healthz";

export async function runPreflight(): Promise<void> {
  try {
    const res = await fetch(WEB_BASE_URL, { method: "GET" });
    if (!res.ok && res.status >= 500) {
      throw new Error(`status ${res.status}`);
    }
  } catch (err) {
    throw new Error(
      `[e2e/preflight] Web dev server not reachable at ${WEB_BASE_URL}. ` +
        `Start it with: cd apps/web && yarn dev. Cause: ${(err as Error).message}`
    );
  }

  try {
    const res = await fetch(API_HEALTH_URL, { method: "GET" });
    if (!res.ok) {
      throw new Error(`status ${res.status}`);
    }
  } catch (err) {
    throw new Error(
      `[e2e/preflight] E2E API not reachable at ${API_HEALTH_URL}. ` +
        `Bring it up with: yarn e2e (from repo root). ` +
        `First time? Run yarn e2e:fresh — it migrates + seeds automatically. ` +
        `Cause: ${(err as Error).message}`
    );
  }
}
