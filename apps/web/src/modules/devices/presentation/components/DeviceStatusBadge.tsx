import { memo } from "react";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import type { DeviceStatus } from "@/modules/devices/domain/entities/Device";

// Semantic mapping (R11: warning is PURPLE, never yellow/amber).
const STATUS_TONE: Record<
  DeviceStatus,
  "success" | "warning" | "error" | "info" | "neutral"
> = {
  CONNECTED: "success",
  CONNECTING: "info",
  QR_PENDING: "warning",
  DISCONNECTED: "neutral",
  LOGGED_OUT: "error",
};

interface DeviceStatusBadgeProps {
  status: DeviceStatus;
}

export const DeviceStatusBadge = memo(function DeviceStatusBadge({
  status,
}: DeviceStatusBadgeProps) {
  const { t } = useTranslation("devices");
  return <StatusBadge status={STATUS_TONE[status]} label={t(`status.${status}`)} />;
});
