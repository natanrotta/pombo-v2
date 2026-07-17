import i18n from "@/shared/i18n";

export function unformatMonetary(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatMonetary(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  const cents = parseInt(digits, 10);
  const reais = cents / 100;

  return reais.toLocaleString(i18n.language || "pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Currency formatter for arbitrary smallest-unit amounts. Locale defaults to
 * the active i18n language so the thousands separator follows the user's UI
 * ("$ 39" en-US, "US$ 39" pt-BR). Currency is passed by the caller and must
 * match the ISO-4217 code stored alongside the price column on the entity.
 *
 * Fractional digits default to 0 because subscription plan prices end in 00.
 * Token package prices can be fractional (e.g. R$ 24,99) — those callers pass
 * `fractionDigits: 2` explicitly.
 */
export function formatPrice(
  cents: number,
  currency: string,
  locale?: string,
  fractionDigits: number = 0
): string {
  return (cents / 100).toLocaleString(locale ?? i18n.language ?? "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}
