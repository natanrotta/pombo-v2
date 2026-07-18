import { Flex, Icon, Spinner, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiActivity } from "@/shared/components/icons";
import { SectionCard } from "@/shared/components/ui/SectionCard";
import { InfoRow } from "@/shared/components/ui/InfoRow";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import type { MessageStatus } from "@/modules/messaging/domain/entities/Message";

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

interface SandboxResultProps {
  messageId: string | null;
  status: MessageStatus | null;
  failureReason: string | null;
  isPolling: boolean;
  isError: boolean;
}

/** The Sandbox's "response" panel: the live delivery status of the last send,
 *  or an empty placeholder before the first send. */
export function SandboxResult({
  messageId,
  status,
  failureReason,
  isPolling,
  isError,
}: SandboxResultProps) {
  const { t } = useTranslation("sandbox");

  return (
    <SectionCard>
      {messageId && status ? (
        <Flex direction="column" gap={4}>
          <Text fontSize="sm" fontWeight="600" color="text.primary">
            {t("result.title")}
          </Text>

          <Flex align="flex-start" justify="space-between" gap={3}>
            <InfoRow label={t("result.messageId")} value={messageId} />
            <Flex align="center" gap={2} flexShrink={0}>
              {isPolling && <Spinner size="xs" color="text.muted" />}
              <StatusBadge
                status={STATUS_TONE[status]}
                label={t(`status.${status}`)}
              />
            </Flex>
          </Flex>

          {failureReason && (
            <InfoRow label={t("result.failureReason")} value={failureReason} />
          )}

          <Text
            fontSize="xs"
            color={isError ? "status.error.fg" : "text.muted"}
          >
            {isError
              ? t("result.statusError")
              : isPolling
                ? t("result.live")
                : t("result.done")}
          </Text>

          <InfoRow label={t("result.note")} value={t("result.noteValue")} />
        </Flex>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={2}
          textAlign="center"
          minH="240px"
          py={8}
        >
          <Icon as={FiActivity} boxSize={8} color="text.muted" />
          <Text fontSize="sm" fontWeight="600" color="text.primary">
            {t("result.empty.title")}
          </Text>
          <Text fontSize="xs" color="text.muted" maxW="xs">
            {t("result.empty.description")}
          </Text>
        </Flex>
      )}
    </SectionCard>
  );
}
