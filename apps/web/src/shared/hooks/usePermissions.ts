import { useAuth } from "@/modules/auth";

/**
 * Central hook for capability checks. In the single-user boilerplate every
 * authenticated user has full access — add real role/permission logic here
 * once your product introduces multiple roles or feature gating.
 */
export function usePermissions() {
  const { isAuthenticated } = useAuth();

  const hasModule = (_mod: string): boolean => isAuthenticated;

  return {
    hasModule,
  };
}
