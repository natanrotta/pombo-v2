import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAutoSave } from "@/shared/hooks/useAutoSave";
import { useNotify } from "@/shared/hooks/useNotify";
import type { ValidationSchema } from "@/shared/hooks/useFormState";

interface CreateModeConfig<TLocal> {
  onCreate: (data: TLocal) => Promise<{ id: string } | null>;
  initialData: TLocal;
  onCreated: (entity: { id: string }) => void;
}

interface UseDetailPageControllerOptions<TLocal> {
  onSave: (data: TLocal) => Promise<unknown>;
  delay?: number;
  autoSaveMessage?: string;
  autoSaveEnabled?: boolean;
  createMode?: CreateModeConfig<TLocal>;
  validationSchema?: ValidationSchema<TLocal>;
  /**
   * When true, the controller fires a final save during unmount if
   * `isDirty` is true. Use on pages where a pending debounce tick must
   * not be lost (e.g. user settings whose fields appear in signed
   * documents). Defaults to false to preserve the legacy behavior of
   * existing call sites — only the new autosave-pilot consumers opt in.
   */
  flushOnUnmount?: boolean;
}

/**
 * Lifecycle of the visible "Salvando.../Salvo/Erro" badge. `idle` is the
 * inert initial state — no badge shown — so a freshly loaded page never
 * implies "we just saved something for you". The state machine flips to
 * `saving` on debounce-tick start, then to `saved` on success or `error`
 * on failure. From `error` the user can retry; the next attempt starts
 * the cycle over.
 */
export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Detail-page form controller with silent background auto-save.
 *
 * UX contract — auto-save is intentionally invisible:
 * - The user types; their value lands in `localData` immediately (no lag).
 * - After `delay` ms of inactivity the data is synced to the server in the
 *   background. The host UI must NOT show a spinner, skeleton, or any
 *   other loading affordance for this path. The only feedback is the
 *   `useNotify().showAutoSaved` toast.
 * - `isDirty` is **derived** from a comparison between the current local
 *   data and the snapshot of the last successful save. It self-corrects on
 *   every save — no manual `setIsDirty(false)` toggle that could flicker
 *   between renders. As long as the user keeps typing, `isDirty` stays
 *   true; once they pause and the auto-save lands, it flips false in a
 *   single render with no transient state.
 * - `isSaving` reflects only the *manual* save / create paths so a user
 *   action drives the explicit busy indicator. Background saves run
 *   silently and do not toggle `isSaving`.
 * - `autoSaveStatus` exposes the autosave state machine for hosts that
 *   want a persistent status badge in addition to (or instead of) the
 *   transient toast. Reading it is opt-in — legacy consumers ignore it.
 *
 * Manual save (`handleManualSave`) and create-mode promotion still flow
 * through the same `onSave` / `onCreate` callbacks, so the cache and
 * server stay in sync regardless of whether the trigger was a debounce
 * tick or a button click.
 */
export function useDetailPageController<TLocal extends Record<string, unknown>>({
  onSave,
  delay = 1500,
  autoSaveMessage,
  autoSaveEnabled = true,
  createMode,
  validationSchema,
  flushOnUnmount = false,
}: UseDetailPageControllerOptions<TLocal>) {
  const { showAutoSaved } = useNotify();

  const initialData = createMode ? createMode.initialData : ({} as TLocal);
  const [localData, setLocalData] = useState<TLocal>(initialData);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(!!createMode);
  const [errors, setErrors] = useState<Partial<Record<keyof TLocal, string>>>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const isCreatingRef = useRef(false);

  // Snapshot of the data last successfully synced to the server. Compared
  // against `localData` to derive `isDirty`. Stored as the JSON
  // representation so deep-equality is cheap and the comparison runs
  // without allocating new objects every render.
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() => JSON.stringify(initialData));

  const localDataSerialized = useMemo(() => JSON.stringify(localData), [localData]);
  const isDirty = localDataSerialized !== savedSnapshot;

  const validateData = useCallback(
    (data: TLocal): boolean => {
      if (!validationSchema) return true;
      const newErrors: Partial<Record<keyof TLocal, string>> = {};
      let isValid = true;

      for (const key of Object.keys(validationSchema) as Array<keyof TLocal>) {
        const validator = validationSchema[key];
        if (!validator) continue;
        const error = validator(data[key], data);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }

      setErrors(newErrors);
      return isValid;
    },
    [validationSchema]
  );

  const triggerCreate = useCallback(
    async (data: TLocal): Promise<boolean> => {
      // Returns `true` when a draft was promoted to a real entity,
      // `false` when the call was skipped (no create-mode config or
      // already in flight) or `onCreate` returned `null` (a non-throw
      // failure signal per the typed contract). Callers use the
      // boolean to drive `autoSaveStatus` — a `null` return must not
      // present as a successful save in the badge.
      if (!createMode || isCreatingRef.current) return false;
      isCreatingRef.current = true;
      setIsManualSaving(true);
      try {
        const created = await createMode.onCreate(data);
        if (!created) return false;
        setIsCreateMode(false);
        // The draft just became a real entity — its current values are
        // now the saved baseline. Without this, the freshly created
        // entity would still register as dirty and the auto-save would
        // immediately fire a redundant update.
        setSavedSnapshot(JSON.stringify(data));
        createMode.onCreated(created);
        return true;
      } finally {
        isCreatingRef.current = false;
        setIsManualSaving(false);
      }
    },
    [createMode]
  );

  // Re-entry guard for the auto-save body. `useAutoSave` already guards
  // its own debounce path, but `flushOnUnmount` and `retryAutoSave`
  // bypass it — without this ref, those two surfaces can race against
  // an in-flight debounce tick and fire a duplicate concurrent PUT.
  const isHandlingAutoSaveRef = useRef(false);

  const handleAutoSave = useCallback(
    async (data: TLocal) => {
      if (!validateData(data)) return;
      if (isHandlingAutoSaveRef.current) return;
      isHandlingAutoSaveRef.current = true;
      setAutoSaveStatus("saving");
      try {
        if (isCreateMode) {
          // In create mode the debounced tick promotes the draft into a
          // real entity (same path as the manual Save). The debounce in
          // `useAutoSave` is what guards against the "1-letter create"
          // bug. `triggerCreate` updates `savedSnapshot` on success and
          // returns false when `onCreate` returned `null` — we must not
          // flip the badge to "saved" in that case.
          const created = await triggerCreate(data);
          if (!created) {
            setAutoSaveStatus("error");
            return;
          }
        } else {
          await onSave(data);
          // Marking the save as committed AFTER the network resolves
          // keeps `isDirty` accurate even if the user kept typing during
          // the request — those new keystrokes diff against this
          // snapshot and trigger another auto-save tick.
          setSavedSnapshot(JSON.stringify(data));
          showAutoSaved(autoSaveMessage);
        }
        setAutoSaveStatus("saved");
      } catch (error) {
        setAutoSaveStatus("error");
        // Re-throw so the upstream `useAutoSave` loop / call site can
        // observe the failure (and the existing `showError` chain still
        // fires via the mutation's own `onError`).
        throw error;
      } finally {
        isHandlingAutoSaveRef.current = false;
      }
    },
    [onSave, showAutoSaved, autoSaveMessage, isCreateMode, validateData, triggerCreate]
  );

  const { saveNow, resetLastSavedData } = useAutoSave({
    data: localData,
    onSave: handleAutoSave,
    delay,
    enabled: isDirty && autoSaveEnabled,
  });

  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      setLocalData((prev) => {
        const next = { ...prev, [key]: value };

        if (validationSchema?.[key as keyof TLocal]) {
          const validator = validationSchema[key as keyof TLocal]!;
          const error = validator(value as TLocal[keyof TLocal], next);
          setErrors((prevErrors) => {
            if (error) return { ...prevErrors, [key]: error };
            const updated = { ...prevErrors };
            delete updated[key as keyof TLocal];
            return updated;
          });
        }

        return next;
      });
    },
    [validationSchema]
  );

  const handleManualSave = useCallback(async () => {
    if (!validateData(localData)) return;
    if (isCreateMode) {
      await triggerCreate(localData);
      return;
    }
    setIsManualSaving(true);
    try {
      // `saveNow()` flows through `handleAutoSave`, which is the single
      // writer of `savedSnapshot`. Writing it again here from a stale
      // closure capture would silently rewind any keystroke landed while
      // the network was in flight — `isDirty` flips false, the autosave
      // never re-fires, and the user's last edit is lost.
      await saveNow();
    } finally {
      setIsManualSaving(false);
    }
  }, [isCreateMode, triggerCreate, localData, saveNow, validateData]);

  /**
   * Re-fire the autosave after a failure. Bypasses `useAutoSave`'s
   * "don't repeat the last attempted payload" guard by calling
   * `handleAutoSave` directly with the current local data — that guard
   * is for autonomous debounce loops, not for an explicit user retry.
   */
  const retryAutoSave = useCallback(async () => {
    try {
      await handleAutoSave(localData);
      // Sync `useAutoSave`'s internal dedup refs with the retry result.
      // Without this, `lastAttemptedDataRef` still holds the failed
      // payload from before the retry — so if the user later edits
      // back to that exact same value, the debounce path silently
      // skips it ("already attempted, give up"). Clearing the ref
      // here makes the next identical edit a real save.
      resetLastSavedData(localData);
    } catch {
      // Errors are already surfaced via the status flip + the mutation's
      // own onError. Swallow here so callers (like the badge's onClick)
      // don't have to wrap every invocation in try/catch.
    }
  }, [handleAutoSave, localData, resetLastSavedData]);

  const reset = useCallback(
    (data: TLocal) => {
      setLocalData(data);
      setSavedSnapshot(JSON.stringify(data));
      setErrors({});
      setAutoSaveStatus("idle");
      resetLastSavedData(data);
    },
    [resetLastSavedData]
  );

  // Flush pending edits on unmount. Use refs so the cleanup reads the
  // latest values without re-registering the effect on every keystroke
  // (which would prematurely fire the cleanup during normal renders).
  const localDataRef = useRef(localData);
  localDataRef.current = localData;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  const handleAutoSaveRef = useRef(handleAutoSave);
  handleAutoSaveRef.current = handleAutoSave;

  useEffect(() => {
    if (!flushOnUnmount) return;
    return () => {
      // The `isDirtyRef.current === false` short-circuit also covers
      // React 18 Strict Mode's dev-time double-invoke: on the synthetic
      // fake-unmount that fires immediately after mount, the form has
      // not been edited yet and `isDirtyRef.current` is false, so no
      // ghost PUT goes out. If a future caller passes `flushOnUnmount`
      // on a component that mounts already-dirty (e.g. hydration from
      // an in-flight draft), revisit this — Strict Mode would then fire
      // a save before the user did anything.
      if (!isDirtyRef.current) return;
      // Skip when a debounce tick is already in flight — the re-entry
      // guard inside `handleAutoSave` would also bail, but checking
      // here avoids an unnecessary promise allocation and makes the
      // single-writer invariant obvious at the call site. The tradeoff
      // is that the most-recent keystroke after that in-flight save
      // may not land; this is preferable to a duplicate concurrent PUT.
      if (isHandlingAutoSaveRef.current) return;
      // Fire-and-forget — the component is gone, so any setState inside
      // handleAutoSave (status flips, snapshot) is no-op'd by React 18+.
      // We only care that the network request lands.
      void handleAutoSaveRef.current(localDataRef.current).catch(() => {});
    };
  }, [flushOnUnmount]);

  return {
    localData,
    setLocalData,
    isDirty,
    /**
     * `true` only while a user-driven save (manual button click or
     * create-mode promotion) is in flight. Background auto-saves do not
     * toggle this flag — they are silent by design.
     */
    isSaving: isManualSaving,
    isCreateMode,
    errors,
    /**
     * Visible state of the background autosave loop. Hosts surface it as a
     * persistent "Salvando.../Salvo/Erro" affordance. Stays `idle` until the
     * first save fires.
     */
    autoSaveStatus,
    handleFieldChange,
    handleManualSave,
    saveNow,
    /** Re-fire the autosave after an error. Safe to call from a UI button. */
    retryAutoSave,
    reset,
  };
}
