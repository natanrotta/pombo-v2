// Mirrors `apps/api/src/shared/utils/transcript-html.ts` so the frontend can
// optimistically merge incoming rich-text into the query cache while the
// backend finishes persisting it. Keep the two implementations in sync.

const HTML_TAG_PATTERN = /<(?:p|h[1-6]|ul|ol|li|blockquote|div)\b/i;

function isHtml(text: string): boolean {
  return HTML_TAG_PATTERN.test(text);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrapInParagraphs(plainText: string): string {
  return plainText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block)}</p>`)
    .join("");
}

export function appendTranscriptHtml(
  existing: string | null | undefined,
  newPlainText: string
): string {
  if (!existing?.trim()) {
    return wrapInParagraphs(newPlainText);
  }
  if (isHtml(existing)) {
    return `${existing}${wrapInParagraphs(newPlainText)}`;
  }
  return `${existing} ${newPlainText}`;
}
