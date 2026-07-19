# Frontend — Accumulated Knowledge

> Living notes for the `/frontend` specialist. Starts mostly empty and fills **with use**:
> every non-obvious lesson (a TanStack Query cache gotcha, a Chakra/theme trap, a hook insight) gets one line here,
> per `.claude/learning/protocol.md`. Authority for patterns stays in `.claude/patterns/frontend.md`.

## Consolidated Principles
- (none yet)

## Component & Hook Patterns
- (none yet)

## Cache / Query Insights
- (none yet)

## Styling Gotchas
- [High] Static assets in `apps/web/public/` are also referenced by the **backend** by absolute URL (`${FRONTEND_URL}/<file>` — e.g. the email logo in the auth email templates/use-cases). When moving/renaming/deleting a public asset, grep the **whole repo** (`apps/api` included), not just `apps/web` — otherwise transactional emails ship a 404 image undetected by the web build.
- To reference a repo-root `apps/web/assets/*` file (sibling of `src/`, not `public/`): add an `@assets` alias in both `vite.config.ts` (`resolve.alias`) and `tsconfig.json` (`paths`), then `import x from "@assets/foo.svg"` (typed `string` via `vite/client`). For the `index.html` favicon, use a **relative** `./assets/foo.svg` href so Vite fingerprints/bundles it (a leading `/` means `public/` → 404). The browser gets the fingerprinted bundle; server-side emails still need a stable copy in `public/`.

## Dead Ends
- (none yet)
