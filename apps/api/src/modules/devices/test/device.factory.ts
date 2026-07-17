import {
  Device,
  DeviceProps,
} from "@modules/devices/domain/entity/device.entity";

let seq = 0;

export function makeDevice(overrides: Partial<DeviceProps> = {}): Device {
  seq++;
  return new Device({
    id: `device-${seq}`,
    accountId: `account-${seq}`,
    name: `device-${seq}`,
    identifier: null,
    status: "DISCONNECTED",
    webhookSecret: "secret-".padEnd(64, "0"),
    webhooks: {
      onConnect: null,
      onDisconnect: null,
      onReceive: null,
      onMessageStatus: null,
      onSend: null,
    },
    lastConnectedAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  });
}
