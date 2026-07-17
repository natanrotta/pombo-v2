import { createHash } from "node:crypto";
import { generateApiToken } from "./api-token.generator";

describe("generateApiToken", () => {
  it("mints a pmb_ token with 40 hex chars (160 bits)", () => {
    const { token } = generateApiToken();
    expect(token).toMatch(/^pmb_[0-9a-f]{40}$/);
  });

  it("stores a SHA-256 hash of the clear token, not the token itself", () => {
    const { token, tokenHash } = generateApiToken();
    expect(tokenHash).toBe(createHash("sha256").update(token).digest("hex"));
    expect(tokenHash).not.toBe(token);
  });

  it("builds a masked display prefix (head + last chars), never the secret", () => {
    const { token, tokenPrefix } = generateApiToken();
    expect(tokenPrefix).toBe(`${token.slice(0, 8)}…${token.slice(-4)}`);
    expect(tokenPrefix).not.toBe(token);
    expect(token).not.toContain(tokenPrefix);
  });

  it("produces a unique token on each call", () => {
    const a = generateApiToken();
    const b = generateApiToken();
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });
});
