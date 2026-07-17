import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { getPostAuthDestination, useAuth } from "@/modules/auth";

export function PublicOnlyRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <>{children}</>;
  }

  if (isAuthenticated) {
    return <Navigate to={getPostAuthDestination(user)} replace />;
  }

  return <>{children}</>;
}
