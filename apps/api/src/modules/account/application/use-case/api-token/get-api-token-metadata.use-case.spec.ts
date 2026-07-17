import { GetApiTokenMetadataUseCase } from "./get-api-token-metadata.use-case";
import { GenerateApiTokenUseCase } from "./generate-api-token.use-case";
import { InMemoryApiTokenRepository } from "@modules/account/test/in-memory-api-token.repository";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

describe("GetApiTokenMetadataUseCase", () => {
  let repo: InMemoryApiTokenRepository;
  let sut: GetApiTokenMetadataUseCase;

  beforeEach(() => {
    repo = new InMemoryApiTokenRepository();
    sut = new GetApiTokenMetadataUseCase(repo);
  });

  it("returns null when the account has never generated a token", async () => {
    expect(await sut.execute(ACCOUNT_A)).toBeNull();
  });

  it("returns the non-secret metadata for the active token", async () => {
    await new GenerateApiTokenUseCase(repo).execute({
      accountId: ACCOUNT_A,
      userId: "user-1",
    });

    const metadata = await sut.execute(ACCOUNT_A);

    expect(metadata).not.toBeNull();
    expect(metadata?.prefix).toMatch(/^pmb_[0-9a-f]{4}…[0-9a-f]{4}$/);
    expect(metadata?.createdAt).toBeTruthy();
    expect(metadata?.lastUsedAt).toBeNull();
    // The projection never carries a `token` or `tokenHash` field (R22).
    expect(metadata).not.toHaveProperty("token");
    expect(metadata).not.toHaveProperty("tokenHash");
  });

  it("does not leak another account's token", async () => {
    await new GenerateApiTokenUseCase(repo).execute({
      accountId: ACCOUNT_B,
      userId: "user-2",
    });

    expect(await sut.execute(ACCOUNT_A)).toBeNull();
  });
});
