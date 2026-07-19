import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Flex, Icon, SimpleGrid, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FiSend } from "@/shared/components/icons";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { SectionCard } from "@/shared/components/ui/SectionCard";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ListPageSkeleton } from "@/shared/components/skeletons/ListPageSkeleton";
import { SelectField } from "@/shared/components/forms/SelectField";
import { FormField } from "@/shared/components/forms/FormField";
import { TextAreaField } from "@/shared/components/forms/TextAreaField";
import { useFormState } from "@/shared/hooks/useFormState";
import { useNotify } from "@/shared/hooks/useNotify";
import { maskPhoneBr, unformatPhone, formatPhoneDisplay } from "@/shared/utils/phone";
import { ROUTE_PATHS } from "@/app/router/RoutePaths";
import { useDevicesList } from "@/modules/devices";
import {
  useSendMessage,
  useMessageStatus,
  type SendMessageArgs,
} from "@/modules/messaging/presentation/hooks/useSendMessage";
import { useRecentRecipients } from "@/modules/messaging/presentation/hooks/useRecentRecipients";
import { RecipientNumberField } from "@/modules/messaging/presentation/components/RecipientNumberField";
import { SandboxResult } from "@/modules/messaging/presentation/components/SandboxResult";
import {
  PIX_KEY_TYPES,
  type PixKeyType,
  type MessageType,
  type SendMessageResult,
  type MessageStatus,
} from "@/modules/messaging/domain/entities/Message";

const MEDIA_TYPES: readonly MessageType[] = ["image", "audio", "video", "document"];
const MESSAGE_TYPES: readonly MessageType[] = [
  "text",
  "image",
  "audio",
  "video",
  "document",
  "pix",
  "list",
];
const MAX_OPTIONS = 10;

const isMedia = (type: string): boolean =>
  MEDIA_TYPES.includes(type as MessageType);

/** `key` is a stable React identity (NOT the WhatsApp option id) so removing a
 *  row mid-list never rematches inputs by position. */
type OptionRow = { key: string; title: string; description: string; id: string };

type SandboxForm = {
  deviceId: string;
  messageType: string;
  phone: string;
  text: string;
  /** Shared across the four media types (only one is active at a time). */
  mediaUrl: string;
  caption: string;
  fileName: string;
  pixKey: string;
  pixType: string;
  listMessage: string;
  listTitle: string;
  listButtonLabel: string;
};

const EMPTY_TYPE_FIELDS = {
  text: "",
  mediaUrl: "",
  caption: "",
  fileName: "",
  pixKey: "",
  pixType: "CPF",
  listMessage: "",
  listTitle: "",
  listButtonLabel: "",
};

export function SandboxPage() {
  const { t } = useTranslation("sandbox");
  const navigate = useNavigate();
  const { showSuccess } = useNotify();

  const { data: devices = [], isLoading } = useDevicesList();
  const sendMessage = useSendMessage();
  const { recents, addRecipient, removeRecipient } = useRecentRecipients();

  const connectedDevices = useMemo(
    () => devices.filter((d) => d.status === "CONNECTED"),
    [devices],
  );

  // Stable per-row React keys, scoped to the component's lifetime (a module-level
  // counter would leak across tests / survive HMR).
  const keySeqRef = useRef(0);
  const makeOption = useCallback((): OptionRow => {
    keySeqRef.current += 1;
    return { key: `opt-${keySeqRef.current}`, title: "", description: "", id: "" };
  }, []);

  const [result, setResult] = useState<SendMessageResult | null>(null);
  const [options, setOptions] = useState<OptionRow[]>(() => [makeOption()]);
  const [optionsError, setOptionsError] = useState<string | null>(null);

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
    {
      deviceId: "",
      messageType: "text",
      phone: "",
      ...EMPTY_TYPE_FIELDS,
    },
    {
      deviceId: (v) => (v ? null : "required"),
      phone: (v) => (unformatPhone(v).length >= 10 ? null : "invalid"),
      text: (v, f) =>
        f.messageType === "text" ? (v.trim() ? null : "required") : null,
      mediaUrl: (v, f) =>
        isMedia(f.messageType) ? (v.trim() ? null : "required") : null,
      pixKey: (v, f) =>
        f.messageType === "pix" ? (v.trim() ? null : "required") : null,
      listMessage: (v, f) =>
        f.messageType === "list" ? (v.trim() ? null : "required") : null,
      listTitle: (v, f) =>
        f.messageType === "list" ? (v.trim() ? null : "required") : null,
      listButtonLabel: (v, f) =>
        f.messageType === "list" ? (v.trim() ? null : "required") : null,
    },
  );
  const { setField, reset } = form;
  const { messageType } = form.formData;

  // Default the device select to the first connected device once the list
  // lands, and re-pick if the current one drops off the connected set.
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
    () => MESSAGE_TYPES.map((value) => ({ value, label: t(`type.${value}`) })),
    [t],
  );

  const pixTypeOptions = useMemo(
    () => PIX_KEY_TYPES.map((value) => ({ value, label: value })),
    [],
  );

  // Switching type keeps device + phone, but clears the type-specific fields so
  // a stale value from another type can never ride along on the next send.
  const handleTypeChange = useCallback(
    (value: string) => {
      reset({
        deviceId: form.formData.deviceId,
        phone: form.formData.phone,
        messageType: value,
        ...EMPTY_TYPE_FIELDS,
      });
      setOptions([makeOption()]);
      setOptionsError(null);
    },
    [reset, form.formData.deviceId, form.formData.phone, makeOption],
  );

  const updateOption = useCallback(
    (index: number, key: keyof OptionRow, value: string) => {
      setOptions((prev) =>
        prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
      );
    },
    [],
  );

  const addOption = useCallback(() => {
    setOptions((prev) =>
      prev.length >= MAX_OPTIONS ? prev : [...prev, makeOption()],
    );
  }, [makeOption]);

  const removeOption = useCallback((index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const buildArgs = useCallback((): SendMessageArgs | null => {
    const deviceId = form.formData.deviceId;
    const phone = unformatPhone(form.formData.phone);
    const f = form.formData;
    const caption = f.caption.trim() || undefined;
    switch (f.messageType as MessageType) {
      case "text":
        return { deviceId, type: "text", input: { phone, text: f.text.trim() } };
      case "image":
        return {
          deviceId,
          type: "image",
          input: { phone, image: f.mediaUrl.trim(), caption },
        };
      case "audio":
        return {
          deviceId,
          type: "audio",
          input: { phone, audio: f.mediaUrl.trim() },
        };
      case "video":
        return {
          deviceId,
          type: "video",
          input: { phone, video: f.mediaUrl.trim(), caption },
        };
      case "document":
        return {
          deviceId,
          type: "document",
          input: {
            phone,
            document: f.mediaUrl.trim(),
            fileName: f.fileName.trim() || undefined,
            caption,
          },
        };
      case "pix":
        return {
          deviceId,
          type: "pix",
          input: { phone, pixKey: f.pixKey.trim(), type: f.pixType as PixKeyType },
        };
      case "list": {
        const cleaned = options
          .map((o) => ({
            title: o.title.trim(),
            description: o.description.trim() || undefined,
            id: o.id.trim(),
          }))
          .filter((o) => o.title && o.id);
        if (cleaned.length === 0) {
          setOptionsError("required");
          return null;
        }
        return {
          deviceId,
          type: "list",
          input: {
            phone,
            message: f.listMessage.trim(),
            optionList: {
              title: f.listTitle.trim(),
              buttonLabel: f.listButtonLabel.trim(),
              options: cleaned,
            },
          },
        };
      }
    }
  }, [form.formData, options]);

  const handleSend = useCallback(async () => {
    setOptionsError(null);
    if (!form.validate()) return;
    const args = buildArgs();
    if (!args) return;
    try {
      const res = await sendMessage.mutateAsync(args);
      setResult(res);
      addRecipient(form.formData.phone);
      showSuccess(t("success"));
    } catch {
      // Error surfaced by the mutation's onError toast.
    }
  }, [form, buildArgs, sendMessage, addRecipient, showSuccess, t]);

  const handleReset = useCallback(() => {
    reset({
      deviceId: form.formData.deviceId,
      messageType: "text",
      phone: "",
      ...EMPTY_TYPE_FIELDS,
    });
    setOptions([makeOption()]);
    setOptionsError(null);
    setResult(null);
  }, [reset, form.formData.deviceId, makeOption]);

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
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} alignItems="start">
          {/* Compose (request) */}
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
                  value={messageType}
                  onChange={handleTypeChange}
                />
              </SimpleGrid>

              <RecipientNumberField
                label={t("fields.phone")}
                placeholder={t("fields.phonePlaceholder")}
                value={form.formData.phone}
                onChange={(v) => setField("phone", maskPhoneBr(v))}
                error={form.errors.phone ? t("errors.phoneInvalid") : undefined}
                inputMode="tel"
                recents={recents}
                onSelectRecent={(digits) => setField("phone", maskPhoneBr(digits))}
                onRemoveRecent={removeRecipient}
              />

              {messageType === "text" && (
                <TextAreaField
                  label={t("fields.text")}
                  placeholder={t("fields.textPlaceholder")}
                  value={form.formData.text}
                  onChange={(v) => setField("text", v)}
                  error={form.errors.text ? t("errors.textRequired") : undefined}
                  rows={6}
                />
              )}

              {isMedia(messageType) && (
                <>
                  <FormField
                    label={t(`fields.media.${messageType}`)}
                    placeholder={t("fields.mediaPlaceholder")}
                    helperText={t("fields.mediaHelper")}
                    value={form.formData.mediaUrl}
                    onChange={(v) => setField("mediaUrl", v)}
                    error={form.errors.mediaUrl ? t("errors.mediaRequired") : undefined}
                  />
                  {messageType === "document" && (
                    <FormField
                      label={t("fields.fileName")}
                      placeholder={t("fields.fileNamePlaceholder")}
                      value={form.formData.fileName}
                      onChange={(v) => setField("fileName", v)}
                    />
                  )}
                  {messageType !== "audio" && (
                    <FormField
                      label={t("fields.caption")}
                      placeholder={t("fields.captionPlaceholder")}
                      value={form.formData.caption}
                      onChange={(v) => setField("caption", v)}
                    />
                  )}
                </>
              )}

              {messageType === "pix" && (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormField
                    label={t("fields.pixKey")}
                    placeholder={t("fields.pixKeyPlaceholder")}
                    value={form.formData.pixKey}
                    onChange={(v) => setField("pixKey", v)}
                    error={form.errors.pixKey ? t("errors.pixKeyRequired") : undefined}
                  />
                  <SelectField
                    label={t("fields.pixType")}
                    options={pixTypeOptions}
                    value={form.formData.pixType}
                    onChange={(v) => setField("pixType", v)}
                  />
                </SimpleGrid>
              )}

              {messageType === "list" && (
                <Flex direction="column" gap={4}>
                  <TextAreaField
                    label={t("fields.listMessage")}
                    placeholder={t("fields.listMessagePlaceholder")}
                    value={form.formData.listMessage}
                    onChange={(v) => setField("listMessage", v)}
                    error={form.errors.listMessage ? t("errors.listMessageRequired") : undefined}
                    rows={3}
                  />
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormField
                      label={t("fields.listTitle")}
                      value={form.formData.listTitle}
                      onChange={(v) => setField("listTitle", v)}
                      error={form.errors.listTitle ? t("errors.listTitleRequired") : undefined}
                    />
                    <FormField
                      label={t("fields.listButtonLabel")}
                      value={form.formData.listButtonLabel}
                      onChange={(v) => setField("listButtonLabel", v)}
                      error={
                        form.errors.listButtonLabel
                          ? t("errors.listButtonLabelRequired")
                          : undefined
                      }
                    />
                  </SimpleGrid>

                  <Flex direction="column" gap={3}>
                    <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                      {t("fields.options")}
                    </Text>
                    {options.map((option, index) => (
                      <SimpleGrid
                        key={option.key}
                        columns={{ base: 1, md: 3 }}
                        spacing={2}
                        alignItems="end"
                      >
                        <FormField
                          label={t("fields.optionTitle")}
                          value={option.title}
                          onChange={(v) => updateOption(index, "title", v)}
                        />
                        <FormField
                          label={t("fields.optionId")}
                          value={option.id}
                          onChange={(v) => updateOption(index, "id", v)}
                        />
                        <Flex gap={2} align="end">
                          <FormField
                            label={t("fields.optionDescription")}
                            value={option.description}
                            onChange={(v) => updateOption(index, "description", v)}
                          />
                          {options.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(index)}
                            >
                              {t("actions.removeOption")}
                            </Button>
                          )}
                        </Flex>
                      </SimpleGrid>
                    ))}
                    {optionsError && (
                      <Text fontSize="sm" color="status.error.fg">
                        {t("errors.optionsRequired")}
                      </Text>
                    )}
                    <Flex>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        isDisabled={options.length >= MAX_OPTIONS}
                      >
                        {t("actions.addOption")}
                      </Button>
                    </Flex>
                  </Flex>
                </Flex>
              )}

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

          {/* Result (response) */}
          <SandboxResult
            messageId={result?.messageId ?? null}
            status={liveStatus}
            failureReason={failureReason}
            isPolling={isPolling}
            isError={statusError}
          />
        </SimpleGrid>
      )}
    </>
  );
}
