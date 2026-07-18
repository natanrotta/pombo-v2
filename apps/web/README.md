# @pombo/web

The web application — a React + Vite single-page app with a **sidebar dashboard shell** and single-user authentication.

**Stack:** React 18 · Vite 5 · TypeScript · Chakra UI 2 · TanStack Query 5 · react-i18next (en/pt-BR/es) · Vitest (unit) · Playwright (e2e).

---

## Structure

```
apps/web/src
├── app/
│   ├── App.tsx                 # root providers
│   ├── router/                 # AppRouter, RoutePaths, route guards, lazyWithRetry
│   ├── providers/              # app-wide context providers
│   └── theme/                  # Chakra theme (light/dark)
├── core/
│   ├── di/                     # repositories DI (repository ← hook ← page)
│   ├── http/                   # axios httpClient (proxies to /api)
│   ├── query/                  # TanStack Query keys + stale times
│   ├── domain/ · errors/       # shared domain types + AppError
├── modules/
│   ├── auth/                   # sign-in, register, forgot/reset password, verify e-mail
│   ├── dashboard/              # authenticated landing (stat cards + empty state)
│   └── settings/               # account settings (profile + change password)
└── shared/
    ├── components/             # layout (AppShell/sidebar), ui, forms, icons, skeletons, animations
    ├── hooks/ · contexts/      # generic hooks + Sidebar context
    ├── i18n/                   # react-i18next setup + locales/{en,pt-BR,es}/*.json
    └── constants/ lib/ types/ utils/
```

Path aliases: `@`, `@/app`, `@/core`, `@/shared`, `@/modules`.

## Routing

Public: `/sign-in`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`.
Authenticated (inside `AppShell` + `ProtectedRoute`): `/dashboard`, `/settings` — plus a `404` fallback. Guards: `ProtectedRoute`, `PublicOnlyRoute`.

## Data flow

`httpClient` (axios) posts to `/api/*`, which the Vite dev server proxies to the API on `:4444`. Data access goes through **DI repositories** (`core/di`) consumed by TanStack Query hooks in each module — a clean `repository → hook → page` pattern you extend per feature.

## Environment

All variables are optional locally (copy `.env.example` to `.env`):

| Var | Purpose |
|---|---|
| `VITE_API_URL` | API base. Empty → falls back to the Vite `/api` proxy (localhost:4444). |
| `VITE_GOOGLE_CLIENT_ID` | Enables "Sign in with Google". Empty → the Google button is inert. |
| `VITE_BUGSNAG_API_KEY` | Error reporting. Empty → disabled. |
| `VITE_APP_VERSION` | Version stamp shown in the UI. |

## Commands

From the repo root:

```bash
yarn web:up        # dev server on http://localhost:4000 (HMR)
yarn build:web     # production build (+ version stamp)
```

Inside the workspace (`apps/web`):

```bash
yarn dev           # vite dev (:4000)
yarn build         # tsc + vite build
yarn test          # Vitest unit tests
yarn test:e2e      # Playwright (spins up the e2e stack)
```

> The API must be running (`yarn backend:up-d`) for authenticated flows to work. Demo login: `demo@example.com` / `Demo1234!`.

## Testing

- **Unit:** Vitest, co-located `*.spec.{ts,tsx}`.
- **E2E:** Playwright in `apps/web/e2e` — a minimal skeleton (auth fixture + api client + an example `auth.spec.ts`). Config in `playwright.config.ts`.
