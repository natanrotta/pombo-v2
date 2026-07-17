export const queryKeys = {
  settings: {
    all: ["settings"] as const,
  },
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    summary: (targetDate?: string) =>
      [...queryKeys.dashboard.all, "summary", targetDate ?? "today"] as const,
  },
  health: {
    all: ["health"] as const,
    version: () => [...queryKeys.health.all, "version"] as const,
  },
} as const;
