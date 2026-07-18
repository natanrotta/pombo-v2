import { test, expect } from "../fixtures/auth.fixture";
import { DEMO_USER } from "../fixtures/constants";

/**
 * Smoke test for the single-user auth boilerplate.
 *
 * This is the one example spec that ships with the boilerplate — use it as a
 * template for new specs. It exercises the two things every deployment must get
 * right: (1) a fresh user can log in through the real UI, and (2) an
 * authenticated session can reach the protected app shell.
 *
 * The `chromium` project loads the storage state written by `global.setup.ts`,
 * so `page` starts already authenticated. The first test clears cookies to
 * exercise the actual login form from a signed-out state.
 */
test.describe("auth", () => {
  test("logs in through the UI and lands on the app shell", async ({ page, context }) => {
    // Start signed-out so we test the real sign-in flow, not the seeded session.
    await context.clearCookies();

    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/sign-in/);

    await page.getByRole("textbox", { name: /e-?mail/i }).fill(DEMO_USER.email);
    // Anchor the label so it matches only the "Senha" field — the bare
    // /senha/i substring also matched the "Mostrar senha" show-password toggle.
    await page.getByLabel(/^(senha|password)$/i).fill(DEMO_USER.password);
    await page.getByRole("button", { name: /^entrar$|^sign in$/i }).click();

    // Successful sign-in redirects into the authenticated app shell; the index
    // route (`/`) redirects to `/devices` (the default landing — there is no
    // `/dashboard` route in this app).
    await expect(page).toHaveURL(/\/devices/, { timeout: 15000 });
  });

  test("an authenticated session can open settings", async ({ page }) => {
    // `page` is pre-authenticated via storageState from global.setup.ts.
    // `/settings` is a legacy deep-link kept as a redirect to `/perfil` (the
    // real profile route) — landing there proves both the redirect and that
    // the auth guard let us into the protected app shell.
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/perfil/, { timeout: 15000 });
  });
});
