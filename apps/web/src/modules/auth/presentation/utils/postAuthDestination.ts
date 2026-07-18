import { ROUTE_PATHS } from "@/app/router/RoutePaths";
import type { AuthUser } from "@/modules/auth/domain/entities/AuthUser";

/**
 * Decides where to send the user right after sign-in/sign-up/google succeeds.
 * Centralised so guards and pages stay in sync — change in one place if the
 * post-auth flow ever gains a step.
 */
export function getPostAuthDestination(user: AuthUser | null): string {
  if (!user) return ROUTE_PATHS.signIn;
  // Unverified email+password accounts must confirm the PIN first. A logged-in
  // user normally already has emailVerified=true (the verify step issues the
  // session), so this is a defensive guard for any path that surfaces an
  // unverified user.
  if (!user.emailVerified) return ROUTE_PATHS.verifyEmail;
  return ROUTE_PATHS.devices;
}
