import { ApiToken } from "./api-token.entity";

function makeApiToken(
  over: Partial<ConstructorParameters<typeof ApiToken>[0]> = {},
) {
  return new ApiToken({
    id: "token-1",
    accountId: "account-a",
    tokenHash: "a".repeat(64),
    tokenPrefix: "pmb_a1b2…9f3c",
    createdByUserId: "user-1",
    lastUsedAt: null,
    revokedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...over,
  });
}

describe("ApiToken", () => {
  it("exposes the display prefix and timestamps via toMetadata()", () => {
    const meta = makeApiToken({
      lastUsedAt: new Date("2026-02-01T10:00:00.000Z"),
    }).toMetadata();

    expect(meta).toEqual({
      prefix: "pmb_a1b2…9f3c",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastUsedAt: "2026-02-01T10:00:00.000Z",
    });
  });

  it("never leaks the token hash", () => {
    const meta = makeApiToken().toMetadata();

    expect(JSON.stringify(meta)).not.toContain("a".repeat(64));
    expect(meta).not.toHaveProperty("tokenHash");
  });

  it("returns a null lastUsedAt when the token has never been used", () => {
    expect(
      makeApiToken({ lastUsedAt: null }).toMetadata().lastUsedAt,
    ).toBeNull();
  });
});
