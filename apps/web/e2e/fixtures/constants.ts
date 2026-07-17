/**
 * Constants shared across e2e fixtures.
 *
 * Mirrors values from `apps/api/src/infrastructure/http/helpers/auth-cookies.ts`.
 * If the API renames these, update here too — keep the two in sync (cheap
 * mirror cost beats importing across the api/web boundary in test code).
 */

export const CSRF_TOKEN_COOKIE = "boilerplate_csrf";
export const ACCESS_TOKEN_COOKIE = "boilerplate_at";

/**
 * Seed credentials created by `apps/api/prisma/seed.ts`. Single-user boilerplate —
 * one demo account you can sign in with immediately after seeding the DB.
 */
export const DEMO_USER = {
  email: "demo@example.com",
  password: "Demo1234!",
} as const;
