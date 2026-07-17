import { container } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import type { AppConfig } from "@shared/provider/app-config.interface";
import type { IDevicesRepository } from "@modules/devices/domain/repository/devices-repository.interface";

export interface GatewayHealth {
  status: "ok" | "degraded";
  devices: { total: number; connected: number };
}

/**
 * WhatsApp gateway health for the `/health` endpoint. Returns `null` when
 * `WHATSAPP_ENABLED=false` — the API reports healthy without touching WhatsApp.
 * When enabled, aggregates the registered devices: degraded (→ 503) if ANY
 * registered device is not CONNECTED. Zero devices is healthy.
 */
export async function getGatewayHealth(): Promise<GatewayHealth | null> {
  const config = container.resolve<AppConfig>(DI_TOKENS.AppConfig);
  if (!config.WHATSAPP_ENABLED) return null;

  const devicesRepository = container.resolve<IDevicesRepository>(
    DI_TOKENS.DevicesRepository,
  );
  // System probe — aggregates devices across every account (not tenant-scoped).
  const devices = await devicesRepository.listAll();
  const connected = devices.filter(
    (device) => device.status === "CONNECTED",
  ).length;
  const healthy = devices.every((device) => device.status === "CONNECTED");

  return {
    status: healthy ? "ok" : "degraded",
    devices: { total: devices.length, connected },
  };
}
