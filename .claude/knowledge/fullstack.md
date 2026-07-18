# Fullstack — Accumulated Knowledge

> Living notes for the `/fullstack` specialist — integration wisdom across the BE↔FE boundary.
> Starts mostly empty and fills **with use** (contract drift traps, type-mirroring lessons),
> per `.claude/learning/protocol.md`.

## Consolidated Principles
- (none yet)

## Contract / Integration Patterns
- **[High] Polymorphic outbox/queue: one generic use case + a shared type→handler dispatch, not N use cases.** When adding many variants that share a subtle write-before-send/idempotency/rate-limit/drain flow (e.g. the 6 rich WhatsApp send types), reuse the existing flow via ONE generic use case that stores a `type` discriminator + a `payload` JSON, and centralize the `type → gateway method` mapping in a single `dispatchOutboxSend(gateway, deviceId, row)` helper consumed by BOTH the live path and the drain. This guarantees a queued variant replays as its own type (never downgraded to the default) and is enforced by an exhaustive `switch`, not convention. Guard the discriminated column with a DB CHECK constraint (`text` XOR `payload`) — Prisma doesn't model CHECK, so add it in the migration + a `///` note in schema.prisma.
- **[High] Idempotency over a JSON payload needs an order-independent compare.** Postgres jsonb does not preserve key order, so a naive `JSON.stringify(existing) === JSON.stringify(incoming)` yields false conflicts on reordered keys. Use a recursive key-sorting `stableStringify` (keep array order — it's semantic). Document that array order is significant for the caller's dedup.
- **[High] Migration convention here = single regenerated `_first` baseline (dev-zero), not incremental folders.** Git history squashes all migrations into `_first`; regenerate it with `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` rather than adding an ALTER migration. `migration-safety` will (correctly for a live-data repo) suggest regenerating the baseline — verify the convention via `git log` on the migrations dir first.
- **[Med] BE/FE type mirrors are manual (isolation model).** A shared enum like `PixKeyType` is declared once on the BE gateway interface and re-declared on the FE entity; add a `// keep in sync` comment pointing at the authoritative source — there's no compile-time link.

## Dead Ends
- (none yet)
