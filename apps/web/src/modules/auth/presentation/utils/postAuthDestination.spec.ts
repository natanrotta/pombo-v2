import { describe, expect, it } from "vitest";
import { getPostAuthDestination } from "./postAuthDestination";
import { ROUTE_PATHS } from "@/app/router/RoutePaths";
import type { AuthUser } from "@/modules/auth/domain/entities/AuthUser";

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "u1",
    name: "Ana",
    email: "ana@test.com",
    emailVerified: true,
    avatarUrl: "",
    language: "pt-BR",
    ...overrides,
  };
}

describe("getPostAuthDestination", () => {
  it("redirects to sign-in when there is no user", () => {
    expect(getPostAuthDestination(null)).toBe(ROUTE_PATHS.signIn);
  });

  it("redirects to verify-email when the email is not verified", () => {
    expect(getPostAuthDestination(makeUser({ emailVerified: false }))).toBe(
      ROUTE_PATHS.verifyEmail
    );
  });

  it("redirects to devices for a verified user", () => {
    expect(getPostAuthDestination(makeUser())).toBe(ROUTE_PATHS.devices);
  });
});
