import { executeSignUpTransaction } from "./user-signup.transaction";
import type { SignUpTransactionData } from "@modules/user/domain/repository/user-repository.interface";

// The transaction creates the account and the user atomically. Mock the tx
// client the `$transaction` callback receives, exposing both create calls.
const { txMock } = vi.hoisted(() => ({
  txMock: {
    account: { create: vi.fn() },
    user: { create: vi.fn() },
  },
}));

vi.mock("@core/database/prisma/prisma-client", () => ({
  prisma: {
    $transaction: vi.fn((cb: (tx: typeof txMock) => unknown) => cb(txMock)),
  },
}));

function userRow(over: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    account_id: "account-1",
    name: "Dra. Ana",
    email: "ana@example.com",
    password: "hashed",
    google_id: null,
    status: "ACTIVE",
    email_verified: false,
    avatar_url: null,
    language: "pt-BR",
    token_version: 0,
    token_expires_at: null,
    refresh_token_hash: null,
    refresh_token_expires_at: null,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
    deleted_at: null,
    ...over,
  };
}

const data: SignUpTransactionData = {
  name: "Dra. Ana",
  email: "ana@example.com",
  password: "hashed",
  status: "ACTIVE",
  tokenExpiresAt: new Date("2026-01-01"),
  refreshTokenHash: "rt-hash",
  refreshTokenExpiresAt: new Date("2026-02-01"),
  language: "pt-BR",
};

describe("executeSignUpTransaction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates the account + user in one transaction and returns the hydrated entity", async () => {
    txMock.account.create.mockResolvedValue({
      id: "account-1",
      name: "Dra. Ana",
    });
    txMock.user.create.mockResolvedValue(userRow());

    const result = await executeSignUpTransaction(data);

    expect(txMock.account.create).toHaveBeenCalledTimes(1);
    expect(txMock.user.create).toHaveBeenCalledTimes(1);
    // The user row is linked to the account created in the same transaction.
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ account_id: "account-1" }),
      }),
    );
    expect(result.user.id).toBe("user-1");
    expect(result.user.accountId).toBe("account-1");
    expect(result.user.email).toBe("ana@example.com");
  });

  it("maps a create failure through mapPrismaError (returns a typed AppError, not the raw error)", async () => {
    txMock.account.create.mockResolvedValue({
      id: "account-1",
      name: "Dra. Ana",
    });
    txMock.user.create.mockRejectedValue(new Error("unique constraint"));

    // A raw Error carries no `code`; a mapped AppError does — asserting the
    // code proves the failure went through mapPrismaError rather than leaking.
    await expect(executeSignUpTransaction(data)).rejects.toMatchObject({
      code: expect.any(String),
    });
  });
});
