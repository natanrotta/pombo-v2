import { describe, expect, it } from "vitest";
import { extractFirstName } from "./extractFirstName";

describe("dashboard extractFirstName (strips honorifics)", () => {
  it("returns the first real given name when no honorific prefix is present", () => {
    expect(extractFirstName("Carlos da Silva")).toBe("Carlos");
    expect(extractFirstName("Ana Pereira")).toBe("Ana");
  });

  it("skips Dr / Dra / Prof / Sr / Sra prefixes (with or without trailing dot)", () => {
    expect(extractFirstName("Dr. Felipe Santos")).toBe("Felipe");
    expect(extractFirstName("Dra. Maria Souza")).toBe("Maria");
    expect(extractFirstName("Sr. João Oliveira")).toBe("João");
    expect(extractFirstName("Sra. Beatriz Lima")).toBe("Beatriz");
    expect(extractFirstName("Prof. Carlos Drummond")).toBe("Carlos");
    expect(extractFirstName("Profa. Lara Andrade")).toBe("Lara");
  });

  it("matches honorifics case-insensitively and without trailing dot", () => {
    expect(extractFirstName("dr Felipe")).toBe("Felipe");
    expect(extractFirstName("DRA Maria")).toBe("Maria");
    expect(extractFirstName("prof Carlos")).toBe("Carlos");
  });

  it("returns null when only honorifics or only whitespace remain", () => {
    expect(extractFirstName("Dr. Dra.")).toBeNull();
    expect(extractFirstName("   ")).toBeNull();
    expect(extractFirstName("")).toBeNull();
  });

  it("collapses multiple whitespace characters", () => {
    expect(extractFirstName("Dr.    Felipe   Santos")).toBe("Felipe");
  });
});
