import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Flex, Icon, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FiSend } from "@/shared/components/icons";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { SectionCard } from "@/shared/components/ui/SectionCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { InfoRow } from "@/shared/components/ui/InfoRow";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { ListPageSkeleton } from "@/shared/components/skeletons/ListPageSkeleton";
import { FormField } from "@/shared/components/forms/FormField";
import { SelectField } from "@/shared/components/forms/SelectField";
import { TextAreaField } from "@/shared/components/forms/TextAreaField";
import { useFormState } from "@/shared/hooks/useFormState";
import { useNotify } from "@/shared/hooks/useNotify";
import { maskPhoneBr, unformatPhone, formatPhoneDisplay } from "@/shared/utils/phone";
import { ROUTE_PATHS } from "@/app/router/RoutePaths";
import { useDevicesList } from "@/modules/devices";
import {
  useSendMessage,
  useMessageStatus,
} from "@/modules/messaging/presentation/hooks/useSendMessage";
import type {
  SendMessageResult,
  MessageStatus,
} from "@/modules/messaging/domain/entities/Message";

type SandboxForm = {
  deviceId: string;
  messageType: string;
  phone: string;
  text: string;
};

const STATUS_TONE: Record<
  MessageStatus,
  "neutral" | "info" | "success" | "error"
> = {
  PENDING: "neutral",
  SERVER_ACK: "info",
  DELIVERY_ACK: "info",
  READ: "success",
  FAILED: "error",
};

export function SandboxPage() {
  const { t } = useTranslation("sandbox");
  const navigate = useNavigate();
  const { showSuccess } = useNotify();

  const { data: devices = [], isLoading } = useDevicesList();
  const sendMessage = useSendMessage();

  const connectedDevices = useMemo(
    () => devices.filter((d) => d.status === "CONNECTED"),
    [devices],
  );

  const [result, setResult] = useState<SendMessageResult | null>(null);

  // Poll the live delivery status of the last send (stops at READ/FAILED).
  const statusQuery = useMessageStatus(
    result?.messageId ?? null,
    result !== null,
  );
  const liveStatus: MessageStatus | null =
    statusQuery.data?.status ?? result?.status ?? null;
  const failureReason = statusQuery.data?.failureReason ?? null;
  const statusError = statusQuery.isError;
  const isPolling =
    liveStatus !== null &&
    liveStatus !== "READ" &&
    liveStatus !== "FAILED" &&
    !statusError;

  const form = useFormState<SandboxForm>(
    { deviceId: "", messageType: "text", phone: "", text: "" },
    {
      deviceId: (v) => (v ? null : "required"),
      phone: (v) => (unformatPhone(v).length >= 10 ? null : "invalid"),
      text: (v) => (v.trim() ? null : "required"),
    },
  );
  const { setField, reset } = form;

  // Default the device select to the first connected device once the list
  // lands, and re-pick if the current one drops off the connected set. Keyed on
  // connectedDevices only (by design): the effect re-runs whenever that list
  // changes, always with the current-render `deviceId` closure — so a manual
  // pick is never clobbered by a refetch that keeps it connected.
  useEffect(() => {
    const current = form.formData.deviceId;
    const stillConnected = connectedDevices.some((d) => d.id === current);
    if (!stillConnected && connectedDevices.length > 0) {
      setField("deviceId", connectedDevices[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedDevices]);

  const deviceOptions = useMemo(
    () =>
      connectedDevices.map((d) => ({
        value: d.id,
        label: d.identifier
          ? `${d.name} · ${formatPhoneDisplay(d.identifier)}`
          : d.name,
      })),
    [connectedDevices],
  );

  const typeOptions = useMemo(
    () => [{ value: "text", label: t("type.text") }],
    [t],
  );

  const handleSend = useCallback(async () => {
    if (!form.validate()) return;
    // Only text sends exist today (spec §4); the type selector is forward-looking.
    if (form.formData.messageType !== "text") return;
    try {
      const res = await sendMessage.mutateAsync({
        deviceId: form.formData.deviceId,
        input: {
          phone: unformatPhone(form.formData.phone),
          text: form.formData.text.trim(),
        },
      });
      setResult(res);
      showSuccess(t("success"));
    } catch {
      // Error surfaced by the mutation's onError toast.
    }
  }, [form, sendMessage, showSuccess, t]);

  const handleReset = useCallback(() => {
    reset({
      deviceId: form.formData.deviceId,
      messageType: "text",
      phone: "",
      text: "",
    });
    setResult(null);
  }, [reset, form.formData.deviceId]);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {isLoading ? (
        <ListPageSkeleton />
      ) : connectedDevices.length === 0 ? (
        <EmptyState
          icon={FiSend}
          title={t("empty.title")}
          description={t("empty.description")}
          actionLabel={t("empty.action")}
          onAction={() => navigate(ROUTE_PATHS.devices)}
        />
      ) : (
        <Flex direction="column" gap={5} maxW="2xl">
          <SectionCard>
            <Flex direction="column" gap={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <SelectField
                  label={t("fields.device")}
                  options={deviceOptions}
                  value={form.formData.deviceId}
                  onChange={(v) => setField("deviceId", v)}
                  error={form.errors.deviceId ? t("errors.deviceRequired") : undefined}
                />
                <SelectField
                  label={t("fields.type")}
                  options={typeOptions}
                  value={form.formData.messageType}
                  onChange={(v) => setField("messageType", v)}
                />
              </SimpleGrid>

              <FormField
                label={t("fields.phone")}
                placeholder={t("fields.phonePlaceholder")}
                value={form.formData.phone}
                onChange={(v) => setField("phone", maskPhoneBr(v))}
                error={form.errors.phone ? t("errors.phoneInvalid") : undefined}
                inputMode="tel"
              />

              <TextAreaField
                label={t("fields.text")}
                placeholder={t("fields.textPlaceholder")}
                value={form.formData.text}
                onChange={(v) => setField("text", v)}
                error={form.errors.text ? t("errors.textRequired") : undefined}
                rows={4}
              />

              <Flex justify="flex-end" gap={2}>
                <Button variant="ghost" onClick={handleReset}>
                  {t("actions.clear")}
                </Button>
                <Button
                  colorScheme="brand"
                  leftIcon={<Icon as={FiSend} />}
                  onClick={handleSend}
                  isLoading={sendMessage.isPending}
                >
                  {t("actions.send")}
                </Button>
              </Flex>
            </Flex>
          </SectionCard>

          {result && liveStatus && (
            <SectionCard>
              <Flex direction="column" gap={3}>
                <Flex align="center" justify="space-between" gap={3}>
                  <InfoRow label={t("result.messageId")} value={result.messageId} />
                  <Flex align="center" gap={2} flexShrink={0}>
                    {isPolling && <Spinner size="xs" color="text.muted" />}
                    <StatusBadge
                      status={STATUS_TONE[liveStatus]}
                      label={t(`status.${liveStatus}`)}
                    />
                  </Flex>
                </Flex>
                {failureReason && (
                  <InfoRow
                    label={t("result.failureReason")}
                    value={failureReason}
                  />
                )}
                <Text
                  fontSize="xs"
                  color={statusError ? "status.error.fg" : "text.muted"}
                >
                  {statusError
                    ? t("result.statusError")
                    : isPolling
                      ? t("result.live")
                      : t("result.done")}
                </Text>
                <InfoRow label={t("result.note")} value={t("result.noteValue")} />
              </Flex>
            </SectionCard>
          )}
        </Flex>
      )}
    </>
  );
}
