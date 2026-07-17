import { useCallback, useEffect, useRef } from "react";

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<unknown>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 3000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef(data);
  const initialRef = useRef(true);
  const isSavingRef = useRef(false);
  const lastSavedDataRef = useRef<string>(JSON.stringify(data));
  /**
   * Last payload we attempted to save (whether it succeeded or not).
   * Without this, a save that 422s on validation triggers another attempt
   * on the very next parent re-render — the `data` reference changes,
   * the effect refires, the serialization still differs from
   * `lastSavedDataRef` (we never persisted the failed value), and we loop.
   * Bumping `lastAttemptedDataRef` on every attempt — pass or fail —
   * breaks the cycle: identical input never tries twice in a row.
   */
  const lastAttemptedDataRef = useRef<string | null>(null);

  latestDataRef.current = data;

  const save = useCallback(async () => {
    if (isSavingRef.current) return;

    const currentSerialized = JSON.stringify(latestDataRef.current);
    if (currentSerialized === lastSavedDataRef.current) return;
    if (currentSerialized === lastAttemptedDataRef.current) return;

    isSavingRef.current = true;
    lastAttemptedDataRef.current = currentSerialized;
    try {
      await onSave(latestDataRef.current);
      lastSavedDataRef.current = currentSerialized;
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave]);

  useEffect(() => {
    // Consume the initial-mount guard regardless of `enabled` so the
    // very first user-driven change (which is what flips `enabled`
    // from false to true) actually schedules a save. With the guard
    // gated behind `!enabled`, `initialRef` would stay true until the
    // first dirty render and then get consumed there — silently
    // swallowing the save for that change. This is invisible for text
    // fields (the next keystroke schedules) but breaks single-click
    // toggles where one click is the whole interaction.
    if (initialRef.current) {
      initialRef.current = false;
      return;
    }
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      // The save promise is fire-and-forget from the timer's perspective.
      // Any rejection has already been observed by the mutation chain
      // (onError → toast); swallowing here avoids "unhandled rejection"
      // noise when the parent's onSave throws (e.g. server 422).
      void save().catch(() => {});
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  const resetLastSavedData = useCallback((newData: T) => {
    const serialized = JSON.stringify(newData);
    lastSavedDataRef.current = serialized;
    // Clearing `lastAttemptedDataRef` here lets the next user edit go
    // through the same gate as a brand-new payload — necessary when the
    // upstream data was reset externally (e.g. cache invalidation after
    // a related mutation) so the autosave isn't stuck thinking it
    // already tried this serialization.
    lastAttemptedDataRef.current = null;
  }, []);

  return { saveNow: save, resetLastSavedData };
}
