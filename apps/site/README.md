# @boilerplate/site

The public **marketing / landing site** — a fast, animated, unbranded tech-product page ready to rebrand.

**Stack:** React 18 · Vite 5 · TypeScript · Chakra UI 2 · GSAP (scroll reveals) · trilingual copy (en / pt / es).

> This is a **standalone yarn project** (its own `yarn.lock`) — it is *not* part of the root Turborepo workspaces. Install and run it via the root `yarn site:*` scripts or directly inside `apps/site`.

---

## Structure

```
apps/site/src
├── main.tsx · App.tsx
├── sections/       # Header, Hero, Problem, Modules (features), Trust, Pricing, Footer
├── content/        # data for the sections: modules.ts, navigation.ts, pricing.ts
├── locales/        # en.ts, pt.ts, es.ts (key-for-key in sync; pt is the type source)
├── pages/          # LandingPage + legal (PrivacyPolicy, TermsOfUse)
├── components/     # Container, GradientHeading, BrandMark, ColorModeToggle, LanguageSwitcher, ...
├── hooks/          # useLocale, useReveal (GSAP), useGsap, useSiteNavigation
└── theme/          # Chakra theme (foundations + components)
```

Path alias: `@` → `./src`. All visible copy lives in `locales/{en,pt,es}.ts` — edit those to change the text (keep the three files in sync). The brand is the neutral placeholder **"Boilerplate"**.

## Commands

From the repo root:

```bash
yarn site:install    # install (standalone project)
yarn site:up         # dev server on http://localhost:3001 (HMR, opens the browser)
yarn site:build      # production build → apps/site/dist
```

Inside the workspace (`apps/site`):

```bash
yarn dev             # vite dev (:3001)
yarn build           # tsc + vite build
yarn preview         # preview the production build
```

## Icons

Favicons live in `public/` (`favicon.svg` is the source of truth — a simple `</>` mark on an indigo→violet tile; `favicon.ico` + `apple-touch-icon.png` are generated companions). Edit `favicon.svg` to rebrand.

## Deploy

Static output (`dist/`) — deploy to any static host. See [`DEPLOY.md`](./DEPLOY.md).
