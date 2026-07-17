/**
 * Tiptap represents an empty document as `<p></p>` (or `<p class="...">`
 * with attributes from extensions like Placeholder). When a parent passes
 * `value: ""` and the editor mounts, tiptap's normalization can fire
 * `onUpdate` with `<p></p>` — which would land in `localData` and diverge
 * from the seeded `savedSnapshot` (`""`), flipping
 * `useDetailPageController.isDirty` to true and triggering a phantom
 * autosave PUT ~1.5s after page load with zero user interaction.
 *
 * Normalizing back to `""` here keeps the round-trip lossless: an
 * untouched empty field emits the same string the BE sent, the dirty
 * check stays accurate, and autosave only fires on actual edits.
 *
 * Strips any number of empty `<p>` tags (with or without attributes).
 * "Empty" includes the three non-content tokens ProseMirror can place
 * inside a semantically empty paragraph depending on browser / extension:
 * whitespace, `&nbsp;` / `&#160;` entities (Placeholder + paste paths),
 * and `<br>` tags (Firefox + ContentEditable hard-break behavior).
 * Preserves real content untouched — if the document contains anything
 * besides empty paragraphs, the original HTML is returned verbatim.
 *
 * If a future extension wraps non-text content in `<p>` (e.g. images:
 * `<p><img src="..." /></p>`), the regex won't match — `<img>` is not in
 * the empty-body whitelist — and the content correctly survives.
 */
export function normalizeTiptapHtml(html: string): string {
  if (!html) return "";
  const stripped = html.replace(/<p[^>]*>(?:\s|&nbsp;|&#160;|<br[^>]*>)*<\/p>/g, "").trim();
  return stripped === "" ? "" : html;
}
