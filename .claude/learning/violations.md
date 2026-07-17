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
| 2026-07-17 | B-C1 (design) | code-reviewer | device.entity.ts `toJSON()` still includes `webhookUrl` field from the legacy single-URL design; spec §5.3 replaces it with 5 per-event columns in PR2, but the field lingers in the PR1 entity and schema — latent contract drift. |
| 2026-07-17 | SC-H1 | code-reviewer | AC-5 webhook-event routing (dispatch-webhook) not updated in PR1 despite spec §9.1 listing it as a PR1 test target; `DispatchWebhookUseCase` still uses `device.webhookUrl` single-URL, not the per-event columns — deferred but not explicitly documented in spec Out list. |
| 2026-07-17 | B-H7 (design) | code-reviewer | `prisma-user-repository.ts` admin `create` path opens an inline $transaction to provision account+user, creating a second code path for account creation parallel to `executeSignUpTransaction`; DRY concern — should reuse the same transaction function. |
