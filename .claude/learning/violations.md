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
| 2026-07-17 | proposed (B-M-stale-QR-window) | code-reviewer | GetDeviceQrUseCase: status=QR_PENDING read and gateway.getCurrentQr() are two separate reads — a QR rotation can deliver a new QR before the DB status write arrives, producing a brief window where qr=null even while QR_PENDING is true; low-probability but real race. |
| 2026-07-17 | SC-H1 | code-reviewer | Spec §9.1 requires update-device-webhooks spec to assert webhook_secret is untouched; the existing spec only asserts `not.toHaveProperty("webhookSecret")` on the JSON projection, not that the stored secret value is unchanged after an update. |
| 2026-07-17 | not-in-checklist (propose: B-H-cache-eviction-race) | code-reviewer | cached-devices.repository.ts write-then-evict ordering leaves a sub-TTL stale window for concurrent findByIdInternal (webhook dispatch); stale webhook URLs for up to CACHE_ENTITY_TTL_SECONDS; env comment does not document the write-race window. |
| 2026-07-17 | not-in-checklist (propose: B-H-di-per-call-resolve) | code-reviewer | api-token-auth.middleware.ts resolves ICacheProvider and AppConfig via container.resolve() on every request inside the closure instead of capturing singletons at middleware creation time. |
| 2026-07-17 | B-C2 (Critical) | code-reviewer | prisma-user-repository.ts findById does findUnique without deleted_at:null — soft-deleted user returned as live; cached-user-repository.ts inherits and extends the window to CACHE_ENTITY_TTL_SECONDS; auth middleware does not check deletedAt/status after findById. |
| 2026-07-17 | not-in-checklist (propose: B-H-di-per-call-resolve) | code-reviewer | api-token-auth.middleware.ts recurring: container.resolve for all 4 singletons inside request handler — same pattern as violations.md 2026-07-17 entry; auth.middleware.ts has identical pattern for JwtProvider and UserRepository. |
