# Code Review — Accumulated Knowledge

> Living notes for `/code-review` + `code-reviewer`: recurring smells and judgment calls learned with use.
> Authority for the anti-pattern codes stays in `.claude/patterns/code-review-checklist.md`.

## Recurring findings

- **Cache-aside + soft-delete interaction:** when a repository's `findById` does not filter `deleted_at: null` at the Prisma level (user repo does `findUnique` without the deleted-at filter), a soft-deleted entity can be cached and returned as live on subsequent hits. Always verify whether the underlying Prisma query includes the soft-delete filter; if not, add a post-deserialize guard or fix the Prisma query.
- **Write-then-evict ordering:** every `inner.write → await invalidateCache` pair has a sub-TTL stale window for concurrent readers. This is inherent to write-aside invalidation; document the worst-case window (= TTL) in env comments, especially for security-adjacent paths (webhook URLs, token data).
- **`container.resolve()` per-request in middleware:** resolving singletons from the DI container on every request is a performance and consistency smell. Capture singletons in the factory-function closure at middleware creation time.
- **`InMemoryCacheProvider.increment` ignores TTL:** the in-memory mock stores counters indefinitely, diverging from real Redis which applies a TTL on first insertion. Security-gate tests that rely on TTL expiry will produce false-passing results.

## Judgment calls / calibration

- The confused-deputy risk of unscoped-cache + in-memory `accountId` guard (`CachedDevicesRepository.findById`) is sound when Redis is a trusted internal boundary and not shared across tenants or apps. The trust assumption must be named at the method level as an auditable invariant.
- Full-parity codec (including `password` bcrypt hash and `refreshTokenHash`) in `cached-user-repository.ts` is intentional and correct: nulling credentials on a cache hit would create hit≠miss divergence. The rationale should be documented at the codec (already is, as of this review).
- `signUpTransaction` not evicting is correct because the new user id cannot be in the cache. However, if that method is ever changed to update an existing user, the no-evict assumption silently breaks — add a comment.

- **Dead-type select in sandbox forms:** when a SelectField exposes message-type options but the send handler ignores the selected value and always calls the text endpoint, the select is visually meaningful but functionally dead. Either remove it (until a second type exists) or gate `handleSend` on `formData.messageType` routing. The pattern recurs any time spec §x says "text only, type selector is for future use."
- **Stale-closure in device-select useEffect:** `useFormState.setField` depends on `formData` and recreates on every form change. A `useEffect(() => { ... }, [connectedDevices])` that calls `setField` and also reads `formData.deviceId` inside the closure will capture a stale `formData` if the user changed the select between two `connectedDevices` updates. Fix: either include `form.formData.deviceId` in the dep array (may cause spurious re-runs) or store the selected id in a separate `useRef` that is always current.
- **`updateStatus` unscoped-by-account in DisconnectDeviceUseCase:** this is intentional and documented in `IDevicesRepository` — the ownership check happens at `findById(accountId, id)` before `updateStatus(device.id, ...)` is called. The pattern is safe as long as `device.id` comes from a prior scoped read. Never forward `device.accountId` from an unscoped method into a scoped query (confused-deputy, per the interface comment).
