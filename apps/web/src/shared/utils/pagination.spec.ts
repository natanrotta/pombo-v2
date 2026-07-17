import { describe, expect, it } from "vitest";
import { buildPaginationQuery } from "./pagination";

describe("buildPaginationQuery", () => {
  it("encodes page and limit as required string fields", () => {
    const qs = buildPaginationQuery({ page: 2, limit: 25, sortOrder: "desc" });
    expect(qs.get("page")).toBe("2");
    expect(qs.get("limit")).toBe("25");
    expect(qs.get("sortOrder")).toBe("desc");
  });

  it("omits search when empty or absent", () => {
    const qsWith = buildPaginationQuery({ page: 1, limit: 10, search: "alice", sortOrder: "asc" });
    expect(qsWith.get("search")).toBe("alice");

    const qsWithout = buildPaginationQuery({ page: 1, limit: 10, sortOrder: "asc" });
    expect(qsWithout.has("search")).toBe(false);

    const qsEmpty = buildPaginationQuery({ page: 1, limit: 10, search: "", sortOrder: "asc" });
    expect(qsEmpty.has("search")).toBe(false);
  });

  it("omits sortBy when not provided but keeps sortOrder", () => {
    const qs = buildPaginationQuery({ page: 1, limit: 10, sortOrder: "asc" });
    expect(qs.has("sortBy")).toBe(false);
    expect(qs.get("sortOrder")).toBe("asc");
  });

  it("joins tagIds with commas when present", () => {
    const qs = buildPaginationQuery({
      page: 1,
      limit: 10,
      tagIds: ["a", "b", "c"],
      sortOrder: "asc",
    });
    expect(qs.get("tagIds")).toBe("a,b,c");
  });

  it("omits tagIds when the array is empty", () => {
    const qs = buildPaginationQuery({ page: 1, limit: 10, tagIds: [], sortOrder: "asc" });
    expect(qs.has("tagIds")).toBe(false);
  });
});
