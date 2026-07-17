import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppModal } from "@/shared/components/ui/AppModal";
import { FileUploadField } from "@/shared/components/forms/FileUploadField";
import { useNotify } from "@/shared/hooks/useNotify";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Modal header. */
  title: string;
  /**
   * Called when the user clicks the upload action. Always receives an array
   * of `File` regardless of `selectionMode` — single-mode callers can simply
   * read `files[0]`. Throwing here surfaces a toast; the modal stays open
   * so the user can retry.
   */
  onUpload: (files: File[]) => Promise<void>;

  /** Defaults to single, matching the most common case (one document). */
  selectionMode?: "single" | "multiple";
  /**
   * Extension whitelist (e.g. `[".pdf", ".png"]`) — drives drop validation
   * AND the native file picker via `accept`. Mirrors the FileUploadField API.
   */
  acceptedTypes?: string[];
  /** Inline `accept` override; usually you'll pass `acceptedTypes` instead. */
  accept?: string;
  /** Caps how many files a single upload batch can hold (multiple mode only).
   *  Pass the remaining slots so the total never exceeds a feature-level limit. */
  maxFiles?: number;
  maxSizeBytes?: number;
  /** Primary line in the dropzone. */
  helperText?: string;
  /** Secondary line (formats + size). Overrides the auto-generated label. */
  formatsLabel?: string;
  /**
   * Action button label inside the modal footer. Defaults to the common
   * `actions.upload` translation.
   */
  primaryActionLabel?: string;
}

/**
 * Shared file-upload modal. Wraps `AppModal` + `FileUploadField` so every
 * upload surface (attachments, imports, future ones)
 * shares the same drag-drop UX, validation feedback, and submit/cancel
 * mechanics. Feature-specific constants (accepted extensions, size cap,
 * copy) stay at the call site because the backend whitelists differ per
 * feature.
 *
 * Pattern decision: this component owns the local "selected files" buffer
 * and the submit lifecycle (loading state, error toast, modal close).
 * Callers only provide an `onUpload` mutation — keeps every consumer free
 * of repetitive useState/try-catch boilerplate.
 */
export function FileUploadModal({
  isOpen,
  onClose,
  title,
  onUpload,
  selectionMode = "single",
  acceptedTypes,
  accept,
  maxFiles,
  maxSizeBytes,
  helperText,
  formatsLabel,
  primaryActionLabel,
}: FileUploadModalProps) {
  const { t } = useTranslation("common");
  const { showError } = useNotify();
  const [files, setFiles] = useState<File[]>([]);
  // Bumping `resetKey` remounts the inner FileUploadField, dropping its
  // internal selectedFiles state. Cheaper than threading a setter through.
  const [resetKey, setResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    setFiles([]);
    setResetKey((k) => k + 1);
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!files.length) return;
    setIsSubmitting(true);
    try {
      await onUpload(files);
      handleClose();
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [files, onUpload, handleClose, showError]);

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="md"
      borderRadius="xl"
      primaryActionLabel={primaryActionLabel ?? t("actions.upload")}
      onPrimaryAction={handleSubmit}
      isPrimaryLoading={isSubmitting}
      isPrimaryDisabled={!files.length}
    >
      <FileUploadField
        key={resetKey}
        label=""
        selectionMode={selectionMode}
        helperText={helperText}
        formatsLabel={formatsLabel}
        acceptedTypes={acceptedTypes}
        accept={accept}
        maxFiles={maxFiles}
        maxSizeBytes={maxSizeBytes}
        onChange={setFiles}
      />
    </AppModal>
  );
}
