/**
 * Minimal HTML escape for the four meta-characters that can break out of
 * an attribute value or text node. Kept dependency-free so the e-mail
 * templates (leaf modules) can reuse it without pulling in a sanitization
 * library. Equivalent to (and replaces) the per-template duplicates that
 * lived in invite/patient-document/password-reset.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
