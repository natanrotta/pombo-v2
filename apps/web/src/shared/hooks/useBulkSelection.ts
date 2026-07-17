import { useCallback, useEffect, useRef, useState } from "react";
import { useNotify } from "@/shared/hooks/useNotify";
import { useTranslation } from "react-i18next";

interface UseBulkSelectionOptions {
  /** Reset selection when these values change (e.g. search, page, filters) */
  resetDeps?: unknown[];
  /** Maximum number of items that can be selected at once (default: 50) */
  maxSelection?: number;
}

const DEFAULT_MAX_SELECTION = 50;

export function useBulkSelection<T extends { id: string }>(
  items: T[],
  options?: UseBulkSelectionOptions
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const maxSelection = options?.maxSelection ?? DEFAULT_MAX_SELECTION;
  const { showWarning } = useNotify();
  const { t } = useTranslation("common");
  const maxWarningShownRef = useRef(false);

  const resetDeps = options?.resetDeps ?? [];

  useEffect(() => {
    setSelectedIds(new Set());
    maxWarningShownRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const showMaxWarning = useCallback(() => {
    if (maxWarningShownRef.current) return;
    maxWarningShownRef.current = true;
    showWarning(t("bulk.maxSelectionReached", { max: maxSelection }));
  }, [showWarning, t, maxSelection]);

  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          maxWarningShownRef.current = false;
        } else {
          if (next.size >= maxSelection) {
            showMaxWarning();
            return prev;
          }
          next.add(id);
        }
        return next;
      });
    },
    [maxSelection, showMaxWarning]
  );

  const selectAll = useCallback(() => {
    const limitedItems = items.slice(0, maxSelection);
    setSelectedIds(new Set(limitedItems.map((item) => item.id)));
    if (items.length > maxSelection) {
      showMaxWarning();
    }
  }, [items, maxSelection, showMaxWarning]);

  const startSelecting = useCallback(() => {
    setIsSelecting(true);
    maxWarningShownRef.current = false;
  }, []);

  const cancelSelection = useCallback(() => {
    setIsSelecting(false);
    setSelectedIds(new Set());
    maxWarningShownRef.current = false;
  }, []);

  return {
    selectedIds,
    isSelecting,
    selectedCount: selectedIds.size,
    allSelected: items.length > 0 && selectedIds.size === Math.min(items.length, maxSelection),
    maxSelection,
    toggleSelect,
    selectAll,
    startSelecting,
    cancelSelection,
  };
}
