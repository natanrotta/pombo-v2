# Frontend Modules

Each product capability lives under `apps/web/src/modules/<name>/` and follows this shape:

```
modules/<name>/
  domain/
    entities/        # Types, labels, selectors, color mappings
    repositories/    # Abstract repository interfaces (DI contracts)
  infrastructure/
    repositories/    # HTTP implementations registered in core/di
  presentation/
    pages/           # Routable React components (1 file = 1 route)
    components/      # Non-routable UI used by pages
    hooks/           # TanStack Query hooks + UI state
    constants/       # Module-scoped constants (feature flags, limits)
    utils/           # Module-scoped helpers (avoid promoting prematurely)
  index.ts           # Public barrel — exported hooks, types, components
```

## Layered rules

- `presentation/` may import from `domain/` and from the module's own `infrastructure/repositories`, but NOT from another module's infrastructure.
- `infrastructure/` implements interfaces declared in `domain/` and is wired in `@/core/di/repositories`.
- `domain/` is framework-agnostic — no React, no Chakra, no Axios.
- Cross-module usage goes through the target module's `index.ts` barrel, never deep into `presentation/` or `infrastructure/`.

## Presentation-only modules

A few modules (dashboard, development, help) have only `presentation/`. That is allowed when the module:

- Owns no persistent domain state of its own (it composes other modules' hooks).
- Has no dedicated repository / HTTP surface.
- Is explicitly UI-only (dev tools, content pages, composition dashboards).

If any of those turns false, add `domain/` (with at least a types file) before adding presentation logic that depends on it.

## Barrel `index.ts`

Every module should export its public surface via `index.ts`:

```ts
export * from "./domain/entities/...";
export * from "./presentation/hooks/...";
// Components consumed by other modules only.
// Do NOT export every page — those are wired in the router directly.
```

Avoid `export *` from a whole layer — pick the names you intend to be public so moves inside the module don't leak types.

## Shared vs module-local

- **Shared** (`@/shared/...`) — reusable across 2+ modules, framework-aware is fine (Chakra components, query hooks).
- **Core** (`@/core/...`) — cross-cutting infra (DI registry, HTTP client, query keys, error types). Grows slowly.
- **Module-local** — anything that would need 2 edits to rename. Keep it inside the module until a second call site appears.

## Testing

- Unit tests colocated as `*.spec.tsx` alongside the source.
- End-to-end tests live in `apps/web/e2e/`.
- Do not create a `__tests__/` folder inside a module — colocation is the convention.
