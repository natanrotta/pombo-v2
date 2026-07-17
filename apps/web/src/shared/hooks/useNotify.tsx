import { useToast } from "@chakra-ui/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AppError } from "@/core/errors/AppError";
import { ErrorCodes } from "@/core/errors/errorCodes";
import { ToastContent } from "./ToastContent";

export function useNotify() {
  const toast = useToast();
  const { t } = useTranslation("common");

  const showSuccess = useCallback(
    (title: string) => {
      toast({
        position: "bottom",
        duration: 2500,
        render: () => <ToastContent title={title} status="success" />,
      });
    },
    [toast]
  );

  const showAutoSaved = useCallback(
    (title = t("notify.autoSaved")) => {
      toast({
        position: "bottom",
        duration: 1500,
        render: () => <ToastContent title={title} status="info" />,
      });
    },
    [toast, t]
  );

  const showInfo = useCallback(
    (title: string) => {
      toast({
        position: "bottom",
        duration: 2500,
        render: () => <ToastContent title={title} status="info" />,
      });
    },
    [toast]
  );

  const showWarning = useCallback(
    (title: string) => {
      toast({
        position: "bottom",
        duration: 3000,
        render: () => <ToastContent title={title} status="warning" />,
      });
    },
    [toast]
  );

  const showError = useCallback(
    (error: unknown, fallbackMessage = t("notify.defaultError")) => {
      let message = fallbackMessage;

      if (error instanceof AppError) {
        message = error.message;

        if (error.code === ErrorCodes.VALIDATION_ERROR && error.details) {
          const details = error.details as Record<string, string[]>;
          const fieldErrors = Object.values(details).flat();
          if (fieldErrors.length > 0) {
            message = fieldErrors.join(". ");
          }
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      // Dedupe identical errors so a misbehaving form (autosave loop,
      // double-click) can't stack the same toast on top of itself.
      // Truncate the keying surface so a long error message doesn't
      // produce an unbounded toast id.
      const id = `error:${message.slice(0, 80)}`;
      if (toast.isActive(id)) return;

      toast({
        id,
        position: "bottom",
        duration: 4000,
        render: () => (
          <ToastContent title={t("notify.errorTitle")} description={message} status="error" />
        ),
      });
    },
    [toast, t]
  );

  return { showSuccess, showAutoSaved, showInfo, showWarning, showError };
}
