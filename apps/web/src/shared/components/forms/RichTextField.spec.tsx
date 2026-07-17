import { describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { RichTextField } from "./RichTextField";
import { normalizeTiptapHtml } from "./normalizeTiptapHtml";

/**
 * Regression coverage for the phantom autosave bug: when the BE returned an
 * empty `notes` field, tiptap's mount normalization would fire `onUpdate`
 * with `<p></p>`, which diverged from the seeded `""` snapshot in
 * `useDetailPageController` and triggered an unintended PUT ~1.5s after
 * page load. `RichTextField` normalizes empty tiptap content to `""` and
 * dedups identical emits to keep the round-trip lossless.
 *
 * jsdom can't drive prosemirror's selection/click handling (it lacks
 * `Document.elementFromPoint` and `Element.getClientRects`), so the
 * "user types" path is covered indirectly by the mount-stability cases
 * here plus the e2e suite. The normalizer contract — which is the load-
 * bearing piece of the dedup gate — is unit-tested below.
 */
describe("normalizeTiptapHtml", () => {
  it.each([
    ["", ""],
    ["<p></p>", ""],
    ['<p class="is-empty"></p>', ""],
    ['<p class="is-empty" data-placeholder="anything"></p>', ""],
    ["<p>   </p>", ""],
    // ProseMirror emits these in certain browser / extension paths and
    // they must all collapse to empty — see regression notes in the
    // normalizer comment block.
    ["<p>&nbsp;</p>", ""],
    ["<p>&#160;</p>", ""],
    ["<p><br></p>", ""],
    ['<p><br class="ProseMirror-trailingBreak"></p>', ""],
    ["<p>\n<br>\n</p>", ""],
    // Real content must survive untouched.
    ["<p>hello</p>", "<p>hello</p>"],
    ["<p><strong>bold</strong></p>", "<p><strong>bold</strong></p>"],
    // Multiple empty paragraphs collapse to "".
    ["<p></p><p></p>", ""],
    // Mixed empty + real → keep original (we don't want to mangle real input).
    ["<p></p><p>real</p>", "<p></p><p>real</p>"],
    // Realistic tiptap output: a list followed by an empty trailing
    // paragraph (what the editor produces when the user types a list
    // and leaves the trailing line empty). Must survive untouched.
    ["<ul><li>item</li></ul><p></p>", "<ul><li>item</li></ul><p></p>"],
  ])("normalizes %j to %j", (input, expected) => {
    expect(normalizeTiptapHtml(input)).toBe(expected);
  });
});

describe("RichTextField", () => {
  it("does NOT emit onChange on mount when value is empty", async () => {
    const onChange = vi.fn();
    renderWithProviders(<RichTextField value="" onChange={onChange} />);

    // Wait long enough for tiptap's onCreate + any synchronous onUpdate
    // tick. If the normalization is missing, the empty `<p></p>` emit
    // lands inside this window.
    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it("does NOT emit onChange on mount when value is the empty paragraph tiptap produces", async () => {
    const onChange = vi.fn();
    renderWithProviders(<RichTextField value="<p></p>" onChange={onChange} />);

    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it("does NOT emit onChange on mount when value is an empty paragraph with attributes", async () => {
    // Some tiptap extensions (Placeholder, custom marks) add attributes to
    // the empty <p>. The normalizer must strip those too.
    const onChange = vi.fn();
    renderWithProviders(
      <RichTextField value='<p class="is-empty" data-placeholder="x"></p>' onChange={onChange} />
    );

    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it("does NOT emit onChange on mount when value already has real content", async () => {
    // Mount-stability also matters for populated fields — re-emitting the
    // BE value would still flip `isDirty=true` on hydrate.
    const onChange = vi.fn();
    renderWithProviders(<RichTextField value="<p>existing notes</p>" onChange={onChange} />);

    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
