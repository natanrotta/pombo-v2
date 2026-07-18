import { useMutation, useQuery } from "@tanstack/react-query";
import { repositories } from "@/core/di/repositories";
import { queryKeys } from "@/core/query/queryKeys";
import { useErrorHandler } from "@/core/query/useErrorHandler";
import type {
  SendTextInput,
  MessageStatus,
} from "@/modules/messaging/domain/entities/Message";

interface SendTextArgs {
  deviceId: string;
  input: SendTextInput;
}

/**
 * Fire-and-report send used by the Sandbox. There is nothing to invalidate —
 * the sandbox holds the result only in memory (spec §6). Errors surface via the
 * shared error toast.
 */
export function useSendMessage() {
  const { handleError } = useErrorHandler();
  return useMutation({
    mutationFn: ({ deviceId, input }: SendTextArgs) =>
      repositories.messaging.sendText(deviceId, input),
    onError: (error) => handleError(error),
  });
}

const MESSAGE_STATUS_POLL_MS = 2_000;
const TERMINAL_STATUSES: ReadonlySet<MessageStatus> = new Set<MessageStatus>([
  "READ",
  "FAILED",
]);

/**
 * Polls `GET /messages/:id` so the Sandbox reflects the live delivery status
 * (PENDING → SERVER_ACK → DELIVERY_ACK → READ / FAILED). Polling stops once a
 * terminal status (READ or FAILED) is reached. `gcTime: 0` drops the snapshot
 * as soon as the result panel unmounts, so a new send starts clean.
 */
export function useMessageStatus(messageId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.messaging.messageStatus(messageId ?? ""),
    queryFn: () => repositories.messaging.getStatus(messageId as string),
    enabled: enabled && Boolean(messageId),
    refetchInterval: (query) => {
      // Stop on a hard error (retries already exhausted) — otherwise a
      // permanent 4xx/5xx would re-fire the failing request every 2s forever
      // (data stays undefined, so the terminal-status check never trips).
      if (query.state.status === "error") return false;
      const status = query.state.data?.status;
      return status && TERMINAL_STATUSES.has(status)
        ? false
        : MESSAGE_STATUS_POLL_MS;
    },
    // Canonical polling pairing: always stale + evict on unmount, so the
    // refetchInterval is the sole source of truth (no stale snapshot on remount).
    staleTime: 0,
    gcTime: 0,
  });
}
