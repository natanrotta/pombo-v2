import { useCallback } from "react";
import {
  Button,
  Flex,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiTrash2, FiZap } from "@/shared/components/icons";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { SectionCard } from "@/shared/components/ui/SectionCard";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { DetailPageGuard } from "@/shared/components/ui/DetailPageGuard";
import { InfoRow } from "@/shared/components/ui/InfoRow";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { useNotify } from "@/shared/hooks/useNotify";
import { ROUTE_PATHS } from "@/app/router/RoutePaths";
import { DeviceStatusBadge } from "@/modules/devices/presentation/components/DeviceStatusBadge";
import { DeviceWebhooksSection } from "@/modules/devices/presentation/components/DeviceWebhooksSection";
import { QrConnectModal } from "@/modules/devices/presentation/components/QrConnectModal";
import {
  useDeviceDetail,
  useDeleteDevice,
} from "@/modules/devices/presentation/hooks/useDevices";
import type { Device } from "@/modules/devices/domain/entities/Device";

function DeviceDetailContent({ device }: { device: Device }) {
  const { t } = useTranslation("devices");
  const navigate = useNavigate();
  const { showSuccess } = useNotify();
  const deleteDevice = useDeleteDevice();
  const qrModal = useDisclosure();
  const deleteConfirm = useConfirm();

  const handleConfirmDelete = useCallback(() => {
    deleteConfirm.confirm(async (id) => {
      try {
        await deleteDevice.mutateAsync(id);
        showSuccess(t("detail.deleted"));
        navigate(ROUTE_PATHS.devices);
      } catch {
        // Error surfaced by the mutation's onError toast.
      }
    });
  }, [deleteConfirm, deleteDevice, showSuccess, t, navigate]);

  const canConnect = device.status !== "CONNECTED";

  return (
    <Flex direction="column" gap={5}>
      <PageHeader
        title={device.name}
        description={t("detail.description")}
        actions={
          <Button
            variant="ghost"
            leftIcon={<Icon as={FiArrowLeft} />}
            onClick={() => navigate(ROUTE_PATHS.devices)}
          >
            {t("detail.back")}
          </Button>
        }
      />

      <SectionCard>
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          gap={4}
        >
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={5} flex="1">
            <Stack spacing={1.5}>
              <Text fontSize="xs" color="text.secondary">
                {t("detail.statusLabel")}
              </Text>
              <DeviceStatusBadge status={device.status} />
            </Stack>
            <InfoRow
              label={t("detail.identifier")}
              value={device.identifier ?? t("list.notPaired")}
            />
            <InfoRow
              label={t("detail.lastConnected")}
              value={
                device.lastConnectedAt
                  ? new Date(device.lastConnectedAt).toLocaleString()
                  : t("list.neverConnected")
              }
            />
          </SimpleGrid>

          <Flex gap={2} align="center">
            {canConnect && (
              <Button
                colorScheme="brand"
                leftIcon={<Icon as={FiZap} />}
                onClick={qrModal.onOpen}
              >
                {t("detail.connect")}
              </Button>
            )}
            <Button
              variant="outline"
              colorScheme="red"
              leftIcon={<Icon as={FiTrash2} />}
              onClick={() => deleteConfirm.requestConfirm(device.id)}
            >
              {t("detail.delete")}
            </Button>
          </Flex>
        </Flex>
      </SectionCard>

      <DeviceWebhooksSection device={device} />

      <QrConnectModal
        isOpen={qrModal.isOpen}
        onClose={qrModal.onClose}
        deviceId={device.id}
      />
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={deleteConfirm.cancel}
        onConfirm={handleConfirmDelete}
        title={t("detail.deleteConfirm.title")}
        description={t("detail.deleteConfirm.description")}
        confirmLabel={t("detail.delete")}
        isDanger
        isLoading={deleteDevice.isPending}
      />
    </Flex>
  );
}

export function DeviceDetailPage() {
  const { id = "" } = useParams();
  const { data: device, isLoading, error } = useDeviceDetail(id);

  return (
    <DetailPageGuard
      isLoading={isLoading}
      error={error}
      entity={device}
      skeletonVariant="two-column"
    >
      {device && <DeviceDetailContent device={device} />}
    </DetailPageGuard>
  );
}
