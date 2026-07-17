# Security — App Security Model & Anti-Patterns (Authority)

**This document is the authoritative security reference for the Pombo.** It describes the security model of the starter application (auth, resource ownership, endpoints, integrations, deploy) and a `SEC-*` anti-pattern catalog. Generic OWASP checklists complement it but never replace it. As you build real features on top of the boilerplate, keep this file in sync with your actual surfaces.

It is consumed by:
- the **`/security`** skill (`.claude/commands/security.md`) — consultant + implementer,
- the **`security-auditor`** agent (`.claude/agents/security-auditor.md`) — read-only scanner,
- `/code-review` and any reviewer who needs the security lens.

It **defers** to: `BASELINE.md` (R1–R28), `code-review-checklist.md` (B-/F-/X-/SC- codes — many are already security codes), `/devops` + `.claude/knowledge/devops.md` (infra). It cross-references those codes instead of duplicating them.

> **Namespace:** security codes are **`SEC-*`**. The bare `S-*` prefix is reserved — never mint an `S-*` security code.
>
> **Anchors drift.** Any `file:line` below is a hint, not a fact. Re-grep the symbol by name before quoting it — files move, line numbers rot.

---

## 0. Data classification

Classify the data your feature touches and handle each tier accordingly:

| Tier | Examples | Rule |
|---|---|---|
| **Secret** | JWT secret, DB/Redis creds, third-party API keys, encryption keys | Env-only (validated config), `chmod 600` on the server, never in logs/commits/images/front. `R22`, `SEC-C4`. |
| **PII** | user name/email/phone, any personal data you add | Never logged (`R5`/`SEC-C7`), never in URLs/referrers (`F-C4`), never returned to a different owner (`SEC-C2`), redacted in pino. |
| **Operational** | ids, timestamps, counts, status | Normal handling; still owner-scoped where applicable. |

The default posture is **fail-closed**: cross-owner access returns `NotFoundError` (404), never `ForbiddenError` (403) — revealing existence is itself a leak (`R3`, `B-H16`).

---

## 1. Trust boundaries (the map you reason about per change)

```
Internet ── CDN / reverse proxy (TLS, WAF) ── Express API
                                                    │
   Browser (SPA)  ─cookies + CSRF→  Express middleware chain
                                                    │
   3rd parties (email provider, S3, any webhook)  ─signed/keyed→  providers
                                                    │
   API ── private network ── Postgres / Redis (never exposed to the internet)
```

Each boundary is a place to ask "what does the other side control, and what am I trusting?". The highest-risk inbound surfaces: **unauthenticated routes**, **webhooks**, and **file uploads**.

---

## 2. Identity & authentication

- **JWT** — `jsonwebtoken`, **HS256 pinned** on verify (alg-confusion defense) — `core/provider/jwt/*`. Secret `env.JWT_SECRET` (min 32 chars, `core/config/env.ts`). Short-lived access TTL + longer refresh TTL.
- **Token revocation** — a `tokenVersion` claim must match the user row; bump it on password reset / logout-all → invalidates all live JWTs. `auth.middleware.ts`.
- **Scoped tokens** — capability JWTs (e.g. `email:verify`) minted via a `signScoped()` helper; gated by `requireScope()` / `rejectScopedTokens()`.
- **Passwords** — bcrypt — `core/provider/hash/*`. Strength enforced in the auth DTO (8+, upper/lower/digit/special).
- **Middleware ladder** — `authMiddleware()` (full token) plus any narrower variants you add (e.g. an email-verification middleware). All in `core/http/middlewares/`.
- **Cookies** — httpOnly session/refresh cookie + a JS-readable CSRF cookie. Prod: `secure` + `sameSite=strict`. `core/http/helpers/auth-cookies.ts`.

## 3. Authorization & resource ownership

- **Ownership isolation** — every repository query on an owned table filters by the owner column (`user_id` today; `account_id` once you add tenancy); entities fetched then checked via an ownership policy (`ensureOwner(entity, ownerId, notFoundCode)`, throws `NotFoundError`). This is the #1 invariant (`R1`/`R3`).
- **RBAC** — add a `requireRole(...roles)` middleware when you introduce roles; admin ≠ authenticated.
- **Request context** — `req.auth` (userId, role, language, scope). Use cases receive `{ userId }` as DTO fields — never `req` (`R7`/`B-C9`).

## 4. HTTP hardening (`core/http/app.ts`)

- **helmet** — HSTS + preload, frameguard deny, referrer strict-origin; **CSP** (`defaultSrc 'self'`, `scriptSrc 'self'`, `objectSrc 'none'`, `frameAncestors 'none'`). `/admin/*` (BullBoard) uses a CSP-relaxed variant.
- **CORS** — origin allowlist from `ALLOWED_ORIGIN` (strips `*` in prod), `credentials: true`.
- **CSRF** — double-submit (CSRF cookie ↔ `X-CSRF-Token` header); safe methods + Bearer-only routes skip. `csrf.middleware.ts` (`B-C12`).
- **Rate limiting (layered)** — a global limiter/IP plus tighter limiters on auth (per IP) and per-user routes. Webhooks skipped.
- **Body limits** — small default (e.g. 10KB); raise per-route only where a payload legitimately needs it (uploads, webhooks).
- **Validation** — Zod via `validateRequest` middleware on params/query/body (`B-C6`). `trust proxy: 1`.
- **Errors** — central handler; `{ ok:false, error:{ message, code, debug? } }`, stack only non-prod, query strings stripped from error reports. `error-handler.middleware.ts`.

## 5. Data layer, secrets, logging

- **Prisma** — no `$queryRaw`/`$executeRaw` template injection; any `$queryRawUnsafe` must use **positional `$1` placeholders + a separate params array** (parameterized, not injectable). Soft delete (`deleted_at: null`, `R2`). `mapPrismaError` on catches (`B-H3`). Cross-owner mutations fail-closed (zero rows).
- **Secrets** — single validated config `core/config/env.ts` (Zod); **no scattered `process.env`**. Any dev-default secret must be a real value in prod. Provider tokens stored encrypted at rest (AES-256-GCM) if you persist them.
- **Logging** — pino with a `redact` list (`core/http/logger.ts`): authorization, cookies, csrf, password/token/refreshToken/credentials, and any personal fields you add. **Redaction is defense-in-depth, not a license to log PII** (`R5`/`SEC-C7`). A new sensitive field in a payload must be added to the redact list (`SEC-M2`).

## 6. Integrations

- **Webhooks** — mount the handler before the JSON parser with `express.raw` (raw body intact) and verify the signature (`constructEvent(rawBody, sig, SECRET)` style) → 4xx on failure. Any new webhook MUST follow this pattern (`SEC-C3`).
- **File upload / S3** — gate MIME + size per type, strip codecs, sanitize the filename, use an owner-scoped S3 key (`{ownerId}/{uuid}-{name}`), signed URLs with a short TTL, compensating delete on failure. `upload.middleware.ts`, `s3-storage-provider.ts`.
- **Providers** — email (transactional), Redis (cache), and whatever you add. All env-keyed via the validated config, reached through a provider port — never a hardcoded client in a use case.

## 7. Deploy security (defer to `/devops`; summary here)

Authoritative: `.claude/knowledge/devops.md`. Security-relevant invariants:
- **Golden rule** — the database/Redis host never exposes its ports to the internet; app↔DB only over a private network / tunnel.
- **Edge** — proxy in front of the origin (hides origin IP) + a valid TLS cert; the origin should accept 80/443 only from the proxy.
- **Secrets** — `.env.prod` on the server (`chmod 600`), not in the image (except the stamped `APP_VERSION`).
- **Backup** — encrypted offsite, private key off the data host; verify with a restore-drill before you trust it.
- **Rotate any secret that ever passed through a chat/log.**

---

## SEC-* Anti-Pattern Catalog

Same rubric as `code-review-checklist.md`: **Critical** blocks merge, **High** fix before merge, **Medium** recommended, **Low** nitpick. Cite the code; cross-refs in parentheses point at the existing checklist/baseline code that already governs the same thing — `SEC-*` is the security *lens* over them, not a replacement.

### Critical (block merge)

| # | Anti-pattern | Why |
|---|--------------|-----|
| SEC-C1 | **Broken authentication** — a route accepting input/returning data mounted without `authMiddleware()` (or the right scope variant) and not in the documented public allowlist in `routes/index.ts` | Anyone can call it (⊃ `B-C11`) |
| SEC-C2 | **Broken object-level auth / IDOR** — entity fetched by id without owner scoping AND without an `ensureOwner(...)` check; or `ForbiddenError` used (reveals existence) | Cross-owner data leak (`R1`/`R3`, ⊃ `B-C1`/`B-C3`/`B-H16`) |
| SEC-C3 | **Unverified webhook / inbound** — webhook handler without signature verification, or JSON body parser placed before the raw-body route (breaks signature verification) | Forged events; follow the raw-body + verify pattern |
| SEC-C4 | **Secret exposed** — credential committed, hardcoded, read outside the validated config, baked into an image, or sent to the front | Immediate revocation needed (`R22`, ⊃ `X-C4`) |
| SEC-C5 | **Injection into an interpreter/sink** — untrusted input reaching a shell, an eval, a template, or (if you add one) an LLM prompt with tool-calling, without sanitization/fencing | Command/prompt hijack → data exfil / unauthorized actions |
| SEC-C6 | **Injection** — raw SQL with string interpolation, shell exec with user input, SSRF (server fetch to a user-controlled URL), or unsafe deserialization | Classic RCE/injection (⊃ `B-C7`) |
| SEC-C7 | **PII leak** — personal data logged, returned in an error to the client, placed in a URL/query/referrer, or emitted to a different owner | Privacy incident (`R5`, ⊃ `B-C5`/`F-C4`) |

### High (should fix)

| # | Anti-pattern | Fix |
|---|--------------|-----|
| SEC-H1 | Route accepts input without `validateRequest(...)` (Zod) | Add the schema + middleware (`B-C6`) |
| SEC-H2 | Sensitive/unauthenticated endpoint (auth, password reset, public share, file upload) without rate limiting | Add the right limiter (`auth`/`user`/`public`) |
| SEC-H3 | Privileged action without a role gate (`requireRole`) | Add the gate; admin ≠ authenticated |
| SEC-H4 | State-changing cookie-auth route bypassing CSRF | Keep it under the CSRF middleware (`B-C12`) |
| SEC-H5 | Weak token/crypto — JWT alg not pinned, no expiry, predictable/guessable token, missing `tokenVersion` revocation, password not bcrypt, MD5/SHA1 for secrets | Mirror the JWT/bcrypt providers |
| SEC-H6 | File upload trusting client MIME/filename, or missing size/type gate, or unsanitized path | Gate via `upload.middleware.ts`; sanitize filename; owner-scoped key |
| SEC-H7 | Permissive CORS (`*` with credentials) or weakened/removed security header / CSP `unsafe-eval` | Keep the allowlist + helmet/CSP posture |
| SEC-H8 | New secret added without env validation + rotation path, or a dev-default secret left in prod | Register in `env.ts`; require a real value in prod (`X-H4`) |

### Medium (recommended)

| # | Anti-pattern | Fix |
|---|--------------|-----|
| SEC-M1 | Error response leaks internals (stack, SQL, file path, dependency version) to the client in prod | Map to an `AppError`+`ErrorCode`; debug only non-prod |
| SEC-M2 | New sensitive/personal field in a request/response payload not added to the pino `redact` list | Add the path to `logger.ts` |
| SEC-M3 | No refresh-token rotation / session-fixation defense on long-lived sessions | Rotate on refresh where feasible; document trade-off |
| SEC-M4 | Sensitive admin/impersonation action without an audit trail | Log the actor + action (no PII) for forensics |
| SEC-M5 | Dependency with a known CVE / no `yarn npm audit` consideration on a new dep | Pin/upgrade; note in the spec Decisions log |
| SEC-M6 | Token promoted from query (`?access_token=`) for SSE/download without proxy stripping it from access logs | Document the proxy requirement; prefer header |

### Low / Nitpick

| # | Issue |
|---|-------|
| SEC-L1 | Verbose version/server header disclosure |
| SEC-L2 | Overly long token/session TTL with no justification |
| SEC-L3 | Missing `aria`/UX affordance that nudges users toward insecure behavior (e.g. paste-secret-in-plaintext field) |

When you spot something real that no `SEC-*` code covers, report it as **`Issue (proposed)`** so it can be promoted into this catalog.

---

## Analysis techniques (how the specialist reasons)

1. **Threat-model the change, not the whole app.** For the diff, ask STRIDE-lite per touched boundary: *Spoofing* (auth ok?), *Tampering* (validation/signature?), *Repudiation* (audit trail?), *Information disclosure* (owner scope + PII in logs/errors?), *DoS* (rate limit + pagination + body cap?), *Elevation* (role gate + IDOR?).
2. **Follow the data.** Trace untrusted input from the boundary to where it's trusted (DB query, shell, file path, response). Every hop is a SEC checkpoint.
3. **Per change-type checklist** — *new route* → SEC-C1/H1/H2/H3 + C2; *new webhook/integration* → SEC-C3/C4; *touches auth/JWT/crypto* → SEC-H5; *new env/secret* → SEC-C4/H8; *logging/new field* → SEC-C7/M2; *file upload* → SEC-H6; *infra/deploy* → defer to `/devops` golden rules (§7).
4. **Prefer existing primitives.** The repo ships the secure way (the ownership policy, `validateRequest`, the limiters, the JWT/bcrypt providers, the redact list, the raw-body webhook pattern). A security fix is usually "use the existing primitive", not "invent crypto".
