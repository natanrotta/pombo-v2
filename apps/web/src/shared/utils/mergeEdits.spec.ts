import { describe, expect, it } from "vitest";
import { mergeEdits } from "./mergeEdits";

describe("mergeEdits", () => {
  it("overrides matching fields with the local edits", () => {
    const entity = { id: "1", name: "Old", count: 10 };
    const result = mergeEdits(entity, { name: "New" });

    expect(result).toEqual({ id: "1", name: "New", count: 10 });
  });

  it("ignores undefined values in the patch (preserves the original field)", () => {
    const entity = { id: "1", name: "Old", count: 10 };
    const result = mergeEdits(entity, { name: undefined });

    expect(result.name).toBe("Old");
  });

  it("respects null as an explicit clear value", () => {
    const entity = { id: "1", description: "Old", tag: null as string | null };
    const result = mergeEdits(entity, { description: null as unknown as string });

    expect(result.description).toBeNull();
  });

  it("does not mutate the input objects", () => {
    const entity = { id: "1", name: "Old" };
    const patch = { name: "New" };
    const result = mergeEdits(entity, patch);

    expect(entity.name).toBe("Old");
    expect(patch.name).toBe("New");
    expect(result).not.toBe(entity);
  });

  it("returns an entity equal to the input when the patch is empty", () => {
    const entity = { id: "1", name: "Old" };
    const result = mergeEdits(entity, {});

    expect(result).toEqual(entity);
    expect(result).not.toBe(entity);
  });
});
