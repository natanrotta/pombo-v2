import { useCallback } from "react";
import { useNotify } from "@/shared/hooks/useNotify";

export function useErrorHandler() {
  const { showError } = useNotify();

  const handleError = useCallback(
    (error: unknown, fallbackMessage?: string) => {
      showError(error, fallbackMessage);
    },
    [showError]
  );

  return { handleError };
}
