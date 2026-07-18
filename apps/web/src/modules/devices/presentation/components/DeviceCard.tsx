import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FiClock, FiTrash2 } from "@/shared/components/icons";
import { EntityCard } from "@/shared/components/ui/EntityCard";
import { DeviceStatusBadge } from "@/modules/devices/presentation/components/DeviceStatusBadge";
import type { Device } from "@/modules/devices/domain/entities/Device";

interface DeviceCardProps {
  device: Device;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DeviceCard = memo(function DeviceCard({
  device,
  onOpen,
  onDelete,
}: DeviceCardProps) {
  const { t } = useTranslation("devices");

  const handleOpen = useCallback(() => onOpen(device.id), [onOpen, device.id]);
  const handleDelete = useCallback(
    () => onDelete(device.id),
    [onDelete, device.id],
  );

  const lastSeen = device.lastConnectedAt
    ? new Date(device.lastConnectedAt).toLocaleDateString()
    : t("list.neverConnected");

  return (
    <EntityCard
      title={device.name}
      subtitle={device.identifier ?? t("list.notPaired")}
      badges={[<DeviceStatusBadge key="status" status={device.status} />]}
      metaItems={[{ icon: FiClock, label: lastSeen }]}
      onClick={handleOpen}
      actionItems={[
        {
          label: t("list.delete"),
          icon: FiTrash2,
          isDanger: true,
          onClick: handleDelete,
        },
      ]}
    />
  );
});
