# Backend — Module-First Architecture

> Canonical reference for how `apps/api/src` is organized. Every backend
> specialist (`/backend`, `/fullstack`) defers to this doc for
> **where a file goes**. The layering rules (Clean Architecture, dependency
> direction) are unchanged — this doc only changes the *physical organization*
> from **layer-first** to **module-first**.

## The one idea

The **module (feature) is the top-level unit**, and the **layer** (domain →
application → infrastructure) is a subfolder inside it. Within each layer,
files are grouped into **singular type subfolders** (`use-case/`, `dto/`,
`entity/`, `controller/`…). The file path *is* the documentation:

```
modules/user/application/use-case/update-user.use-case.ts
   └ module  └ layer      └ type      └ file
```

You read the path and you know: which feature, which layer, which kind of
artifact — without opening the file.

## Top level

```
apps/api/
  scripts/              # operational entrypoints (seeds, one-off tasks) — OUTSIDE src
  prisma/               # schema.prisma + migrations
  src/
    modules/            # everything the product does (one folder per DOMAIN)
    shared/             # pure kernel: zero domain knowledge, reusable anywhere
    core/               # the chassis: wires the app, no business rule
    test/               # cross-cutting test kit (aggregator mocks, vitest setup)
    main.ts             # bootstrap only (listen, cron registration, queue wiring)
```

Responsibility in one line each:

- **`modules/`** — the business. Each module owns its full vertical slice + its co-located tests + its factories.
- **`shared/`** — a pure library the modules consume (errors, i18n, generic helpers). No domain.
- **`core/`** — the skeleton that boots the app (HTTP chassis, DI, config, DB client, generic provider impls).
- **`test/`** — test plumbing that belongs to nobody in particular.
- **`scripts/`** — operational tools, run by hand / CI. Not part of the running server.

## The canonical module skeleton (always identical)

Every folder in `modules/` has **exactly** this tree. Predictability is the point.

```
modules/<domain>/
  domain/
    entity/            <x>.entity.ts            (+ <x>.entity.spec.ts)
    repository/        <x>.repository.ts        (interface = port)
    provider/          <x>-provider.ts          (module-owned port, only if any)
  application/
    use-case/          create-<x>.use-case.ts   (+ .spec.ts)
    dto/               <x>.dto.ts               (Zod)
    service/           <x>.service.ts           (app service, only if any)
  infrastructure/
    controller/        <x>.controller.ts        (+ .spec.ts)
    route/             <x>.route.ts
    repository/        prisma-<x>.repository.ts  (implementation)
    provider/          <adapter>.ts             (port implementation, only if any)
  util/                <x>-helper.ts            (domain-flavored helpers — see below)
  constant/            <x>.constant.ts          (domain constants)
  test/                <x>.factory.ts           (test data builders)
  <domain>.module.ts   # DI wiring: binds this module's interfaces → impls
```

Subfolders that have no files for a given module simply don't exist yet — but
when they do, they use exactly these names.

### Naming convention

- Type subfolders are **singular**: `use-case/`, `dto/`, `entity/`, `repository/`, `controller/`, `route/`, `provider/`, `util/`, `constant/`.
- File suffixes are unchanged from today: `*.use-case.ts`, `*.entity.ts`, `*.repository.ts` (interface), `prisma-*.repository.ts` (impl), `*.controller.ts`, `*.route.ts`, `*.dto.ts`, `*.spec.ts`.

## Tests

Unit specs are **co-located** — the `.spec.ts` lives in the *same subfolder* as
the file it tests (this is already the project rule: 100% of specs are
co-located). The spec travels with its file during migration.

```
application/use-case/
  update-user.use-case.ts
  update-user.use-case.spec.ts   # glued, same folder
```

- **Factories** (build a module's entity → carry domain knowledge) live in `modules/<owner>/test/`.
- **Aggregator mocks + global vitest setup** (cross-module) live in top-level `src/test/`.

## The dependency law (the only import rule)

```
modules/  →  may import  →  shared/ , core/ (ports)
core/     →  may import  →  shared/
shared/   →  imports nobody
modules/  →  NEVER import another module's infrastructure/
             (only its domain/ or application/ — the interface / use-case)
```

The direction always points **inward** (`infrastructure → application → domain`),
same Clean Architecture rule as before. The day `shared/util/x.ts` needs to
import from a `module/`, that's proof it was never shared — it belongs to that
module. This is the leak detector.

## `shared/` — the pure kernel

A file is `shared` **only if it has zero domain knowledge** — it would make
sense pasted into a completely different app (an e-commerce, a blog). If the
name mentions a business concept (`user`, `profile`, `jwt-scope`), it is
**not** shared — it belongs to that module.

```
shared/
  error/       app-error.ts, error-codes.ts
  i18n/        index.ts, zod-error-map.ts, locale/
  util/        dedupe.ts, pagination.ts, parse-expires-in.ts, html.ts,
               generate-public-code.ts
  constant/    limits.ts, defaults.ts, queue-jobs.ts
  policy/      ensure-authenticated.ts
  provider/    cache-provider.ts, event-bus.ts, queue-provider.ts,
               encryption-provider.ts, mail-provider.ts   (generic PORTS only)
```

## `core/` — the chassis

Infrastructure that **boots** the app. No business rule, but also not a
reusable library — it's the skeleton.

```
core/
  http/          app.ts, middleware/ (auth, csrf, rate-limit, error-handler, locale…)
  container/     index.ts, tokens.ts, boot-guard/           (tsyringe DI)
  config/        env.ts (Zod)
  database/      prisma-client.ts, seed/
  provider/      redis-cache.ts, bullmq-queue.ts, event-bus.ts, s3-storage.ts,
                 jwt.ts, bcrypt-hash.ts   (IMPLEMENTATIONS of the generic ports)
  service/       error-reporter/, scheduler/, aes-gcm-encryption.service.ts
```

**Port vs impl split:** `shared/provider/` holds the **interface**
(`ICacheProvider` — a pure port any module imports); `core/provider/` holds the
**implementation** (`redis-cache.ts` — the real Redis). Modules depend on the
port, never on Redis.

> `src/generated/` (Prisma client) is a **build artifact** (gitignored). Its
> location is dictated by the `generator.output` in `schema.prisma`, not by
> architecture taste — it stays addressed via the `@generated` alias and is out
> of scope to relocate.

## The domains (module list)

Pombo ships with **2 domains** — the minimum a real product needs.
Add new modules by cloning the canonical skeleton above.

| Domain | Owns |
|---|---|
| `auth` | authentication: sign-in, sign-out, token issuance/refresh, password reset, jwt-scopes |
| `user` | the single application user: profile, credentials, settings |

Cross-module imports go through another module's `domain/`/`application/`, never
its `infrastructure/`. When you grow the product, keep each new feature as its
own vertical slice with the same skeleton — the boundaries matter more than the
exact count.

> The `user` module was originally named `platform` in the source project; the
> Pombo uses `user` for clarity. If you still see a `platform/` folder in
> `apps/api/src/modules/`, treat it as the `user` domain.

## Where do I put X? (cheat-sheet)

| Creating… | Goes in |
|---|---|
| entity, pure rule | `modules/<m>/domain/entity/` |
| repository interface (port) | `modules/<m>/domain/repository/` |
| use case | `modules/<m>/application/use-case/` |
| Zod input/output schema | `modules/<m>/application/dto/` |
| controller / route | `modules/<m>/infrastructure/controller\|route/` |
| concrete Prisma repo | `modules/<m>/infrastructure/repository/` |
| helper with a business name | `modules/<owner>/util/` |
| generic helper (no domain) | `shared/util/` |
| middleware, app.ts, DI, config | `core/` |
| error, i18n, tenancy policy | `shared/` |
| test factory | `modules/<owner>/test/` |
| cross-module mock / vitest setup | `src/test/` |
| operational script | `apps/api/scripts/` (outside src) |
