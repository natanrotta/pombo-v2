# Security — Accumulated Knowledge (living)

> Living notes for the `/security` skill + `security-auditor`: principles and open risks discovered with use.
> Authority for the model + `SEC-*` catalog stays in `.claude/patterns/security.md`.

## Principles
- Fail closed: cross-owner access returns `NotFoundError` (404), never `ForbiddenError` (403).
- Reuse the existing secure primitive (ownership policy, `validateRequest`, the limiters, JWT/bcrypt providers, the pino `redact` list) instead of inventing crypto.

## Open risks / backlog
- (none yet)
