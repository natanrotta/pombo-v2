import { useMutation } from "@tanstack/react-query";
import { repositories } from "@/core/di/repositories";
import { useErrorHandler } from "@/core/query/useErrorHandler";
import type { SendTextInput } from "@/modules/messaging/domain/entities/Message";

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
