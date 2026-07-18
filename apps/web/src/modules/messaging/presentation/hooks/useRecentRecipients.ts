import { useCallback, useState } from "react";
import { STORAGE_KEYS } from "@/shared/constants/storageKeys";
import { unformatPhone } from "@/shared/utils/phone";

/** How many recent recipients we keep around as suggestions. */
const MAX_RECENTS = 5;

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sandboxRecentRecipients);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive: only keep well-formed digit strings, capped.
    return parsed
      .filter((v): v is string => typeof v === "string" && /^\d+$/.test(v))
      .slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

function persist(recents: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.sandboxRecentRecipients, JSON.stringify(recents));
  } catch {
    // Ignore quota / private-mode failures — recents are a convenience only.
  }
}

/**
 * Browser-cached list of recently used Sandbox recipient numbers (raw digits,
 * most-recent first, deduped, capped at {@link MAX_RECENTS}). Powers the
 * suggestion dropdown on the recipient field so re-testing the same number is a
 * single click. Purely local convenience — never round-trips to the API.
 */
export function useRecentRecipients() {
  const [recents, setRecents] = useState<string[]>(readRecents);

  const addRecipient = useCallback((value: string) => {
    const digits = unformatPhone(value);
    if (!digits) return;
    setRecents((prev) => {
      const next = [digits, ...prev.filter((d) => d !== digits)].slice(0, MAX_RECENTS);
      persist(next);
      return next;
    });
  }, []);

  const removeRecipient = useCallback((value: string) => {
    const digits = unformatPhone(value);
    setRecents((prev) => {
      const next = prev.filter((d) => d !== digits);
      persist(next);
      return next;
    });
  }, []);

  return { recents, addRecipient, removeRecipient };
}
