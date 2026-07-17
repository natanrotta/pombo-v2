import { useCallback, useState } from "react";

export function useConfirm() {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const requestConfirm = useCallback((id: string) => {
    setPendingId(id);
  }, []);

  const cancel = useCallback(() => {
    setPendingId(null);
  }, []);

  const confirm = useCallback(
    (action: (id: string) => void) => {
      if (pendingId) {
        action(pendingId);
        setPendingId(null);
      }
    },
    [pendingId]
  );

  return {
    isOpen: pendingId !== null,
    pendingId,
    requestConfirm,
    cancel,
    confirm,
  };
}
