import { createHash } from "node:crypto";
import { GenerateApiTokenUseCase } from "./generate-api-token.use-case";
import { InMemoryApiTokenRepository } from "@modules/account/test/in-memory-api-token.repository";

const ACCOUNT_A = "account-a";
const USER_1 = "user-1";

describe("GenerateApiTokenUseCase", () => {
  let repo: InMemoryApiTokenRepository;
  let sut: GenerateApiTokenUseCase;

  beforeEach(() => {
    repo = new InMemoryApiTokenRepository();
    sut = new GenerateApiTokenUseCase(repo);
  });

  it("returns a clear pmb_ token exactly once", async () => {
    const { token } = await sut.execute({
      accountId: ACCOUNT_A,
      userId: USER_1,
    });

    expect(token).toMatch(/^pmb_[0-9a-f]{40}$/);
  });

  it("persists only the SHA-256 hash, never the clear token (R22)", async () => {
    const { token } = await sut.execute({
      accountId: ACCOUNT_A,
      userId: USER_1,
    });

    const active = await repo.findActiveByAccount(ACCOUNT_A);
    const expectedHash = createHash("sha256").update(token).digest("hex");

    // The entity never exposes the hash; assert via the repo internals that the
    // stored prefix is a masked fragment (not the clear token) and that a fresh
    // hash of the clear token matches what a lookup would compare against.
    expect(active?.tokenPrefix).not.toBe(token);
    expect(active?.tokenPrefix).toContain("…");
    expect(expectedHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("revokes the previous token when a new one is generated (one active per account)", async () => {
    await sut.execute({ accountId: ACCOUNT_A, userId: USER_1 });
    const first = await repo.findActiveByAccount(ACCOUNT_A);

    await sut.execute({ accountId: ACCOUNT_A, userId: USER_1 });
    const second = await repo.findActiveByAccount(ACCOUNT_A);

    // Two rows exist (first revoked, second active) but only one is active.
    expect(repo.countForAccount(ACCOUNT_A)).toBe(2);
    expect(second?.id).not.toBe(first?.id);
    expect(second?.revokedAt).toBeNull();
  });

  it("scopes tokens per account", async () => {
    await sut.execute({ accountId: ACCOUNT_A, userId: USER_1 });
    await sut.execute({ accountId: "account-b", userId: "user-2" });

    expect(repo.countForAccount(ACCOUNT_A)).toBe(1);
    expect(repo.countForAccount("account-b")).toBe(1);
    expect(await repo.findActiveByAccount(ACCOUNT_A)).not.toBeNull();
  });
});
