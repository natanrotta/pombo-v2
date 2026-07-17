import i18n from "@/shared/i18n";

export function calculateAge(birthDate: string): string {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const t = i18n.t;
  const and = t("age.and", { ns: "common" });

  const parts: string[] = [];
  if (years > 0) parts.push(t("age.year", { ns: "common", count: years }));
  if (months > 0) parts.push(t("age.month", { ns: "common", count: months }));
  if (days > 0 || parts.length === 0) parts.push(t("age.day", { ns: "common", count: days }));

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} ${and} ${parts[1]}`;
  return `${parts[0]}, ${parts[1]} ${and} ${parts[2]}`;
}

export function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(i18n.language || "pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(i18n.language || "pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTimeShort(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString(i18n.language || "pt-BR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateOnly(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString(i18n.language || "pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Long-form date for billing/subscription surfaces ("05 de julho de 2026").
 * Returns "-" for null/empty so callers can render it directly.
 */
export function formatLongDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(i18n.language || "pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function extractDateOnly(isoString: string): string {
  if (!isoString) return "";
  return isoString.includes("T") ? isoString.split("T")[0] : isoString;
}

/**
 * Formats a "created at / updated at" timestamp for listing cards.
 * Reads the active i18n language so the same code renders pt-BR, en and es.
 * Use this instead of inline toLocaleDateString("pt-BR", ...) — hardcoded
 * locales drift from the user's language setting.
 */
export function formatCreatedDate(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }
): string {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString(i18n.language || "pt-BR", options);
}
