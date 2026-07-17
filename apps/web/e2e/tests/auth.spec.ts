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
  test("logs in through the UI and lands on the dashboard", async ({ page, context }) => {
    // Start signed-out so we test the real sign-in flow, not the seeded session.
    await context.clearCookies();

    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/sign-in/);

    await page.getByRole("textbox", { name: /e-?mail/i }).fill(DEMO_USER.email);
    await page.getByLabel(/senha|password/i).fill(DEMO_USER.password);
    await page.getByRole("button", { name: /^entrar$|^sign in$/i }).click();

    // Successful sign-in redirects into the authenticated app shell.
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("an authenticated session can open settings", async ({ page }) => {
    // `page` is pre-authenticated via storageState from global.setup.ts.
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/, { timeout: 15000 });
  });
});
