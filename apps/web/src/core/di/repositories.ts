import type { SettingsRepository } from "@/modules/settings/domain/repositories/SettingsRepository";
import type { AuthRepository } from "@/modules/auth/domain/repositories/AuthRepository";
import type { DashboardRepository } from "@/modules/dashboard/domain/repositories/DashboardRepository";
import type { DeviceRepository } from "@/modules/devices/domain/repositories/DeviceRepository";
import type { AccountRepository } from "@/modules/account/domain/repositories/AccountRepository";

import { HttpSettingsRepository } from "@/modules/settings/infrastructure/repositories/HttpSettingsRepository";
import { HttpAuthRepository } from "@/modules/auth/infrastructure/repositories/HttpAuthRepository";
import { HttpDashboardRepository } from "@/modules/dashboard/infrastructure/repositories/HttpDashboardRepository";
import { HttpDeviceRepository } from "@/modules/devices/infrastructure/repositories/HttpDeviceRepository";
import { HttpAccountRepository } from "@/modules/account/infrastructure/repositories/HttpAccountRepository";

export const repositories = {
  settings: new HttpSettingsRepository() as SettingsRepository,
  auth: new HttpAuthRepository() as AuthRepository,
  dashboard: new HttpDashboardRepository() as DashboardRepository,
  devices: new HttpDeviceRepository() as DeviceRepository,
  account: new HttpAccountRepository() as AccountRepository,
} as const;
