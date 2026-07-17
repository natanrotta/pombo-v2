/**
 * Lifecycle of a WhatsApp device socket. Mirrors the Prisma `device_status`
 * enum. A device is only "live" when CONNECTED; every other status means
 * /health reports degraded.
 */
export type DeviceStatus =
  "DISCONNECTED" | "CONNECTING" | "QR_PENDING" | "CONNECTED" | "LOGGED_OUT";
