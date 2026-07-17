import type { SettingsRepository } from "@/modules/settings/domain/repositories/SettingsRepository";
import type { AuthRepository } from "@/modules/auth/domain/repositories/AuthRepository";
import type { DashboardRepository } from "@/modules/dashboard/domain/repositories/DashboardRepository";

import { HttpSettingsRepository } from "@/modules/settings/infrastructure/repositories/HttpSettingsRepository";
import { HttpAuthRepository } from "@/modules/auth/infrastructure/repositories/HttpAuthRepository";
import { HttpDashboardRepository } from "@/modules/dashboard/infrastructure/repositories/HttpDashboardRepository";

export const repositories = {
  settings: new HttpSettingsRepository() as SettingsRepository,
  auth: new HttpAuthRepository() as AuthRepository,
  dashboard: new HttpDashboardRepository() as DashboardRepository,
} as const;
