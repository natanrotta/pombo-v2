# Violations Ledger — Pattern-Adoption Telemetry

**Append-only.** Every Critical/High finding surfaced during the babysit loop, `/check`, or `/code-review` is logged here as one line. Format and rules: `.claude/learning/protocol.md` § Pattern-Adoption Telemetry.

The ledger feeds the **recurring-violations surfacing** pass: codes that appear ≥5 times in 30 days are candidates for promotion into a hook, into BASELINE, or into a module-specific knowledge entry.

**Never edit historical entries.** Mark promoted ones with `[PROMOTED YYYY-MM-DD]` only.

---

## Entries

| Date | Code | Fixed-by | Context |
| ---- | ---- | -------- | ------- |
