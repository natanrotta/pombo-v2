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
  devices: {
    all: ["devices"] as const,
    list: () => [...queryKeys.devices.all, "list"] as const,
    detail: (id: string) => [...queryKeys.devices.all, "detail", id] as const,
    qr: (id: string) => [...queryKeys.devices.all, "qr", id] as const,
  },
  account: {
    all: ["account"] as const,
    apiToken: () => [...queryKeys.account.all, "api-token"] as const,
  },
  health: {
    all: ["health"] as const,
    version: () => [...queryKeys.health.all, "version"] as const,
  },
} as const;
