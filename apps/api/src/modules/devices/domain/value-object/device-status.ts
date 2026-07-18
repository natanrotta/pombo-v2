/**
 * Lifecycle of a WhatsApp device socket. Mirrors the Prisma `device_status`
 * enum. A device is only "live" when CONNECTED; every other status is reported
 * (as an informational connected-count) by `GET /api/health` without making the
 * process unhealthy.
 */
export type DeviceStatus =
  "DISCONNECTED" | "CONNECTING" | "QR_PENDING" | "CONNECTED" | "LOGGED_OUT";
