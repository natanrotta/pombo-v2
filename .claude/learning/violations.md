# Violations Ledger — Pattern-Adoption Telemetry

**Append-only.** Every Critical/High finding surfaced during the babysit loop, `/check`, or `/code-review` is logged here as one line. Format and rules: `.claude/learning/protocol.md` § Pattern-Adoption Telemetry.

The ledger feeds the **recurring-violations surfacing** pass: codes that appear ≥5 times in 30 days are candidates for promotion into a hook, into BASELINE, or into a module-specific knowledge entry.

**Never edit historical entries.** Mark promoted ones with `[PROMOTED YYYY-MM-DD]` only.

---

## Entries

| Date | Code | Fixed-by | Context |
| ---- | ---- | -------- | ------- |
| 2026-07-17 | B-H-reconnect-unref | finish-task /code-review | session-manager reconnect setTimeout not unref'd — up to RECONNECT_MAX_DELAY_MS SIGTERM shutdown delay when gateway enabled; fixed with .unref(). |
| 2026-07-17 | F-C3 | finish-task /code-review | Unused amber palette exported from web theme colors.ts — latent yellow/amber supply-side surface; removed. |
| 2026-07-17 | B-C8 | accepted | GET /api/health returns {ok,version,uptimeSeconds} not {ok,data} — pre-existing monitoring-probe shape read via .ok; accepted, follow-up if web consumes it. |
