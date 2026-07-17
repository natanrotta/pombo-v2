import { prisma } from "@core/database/prisma/prisma-client";
import { executeSignUpTransaction } from "./user-signup.transaction";
import type { SignUpTransactionData } from "@modules/user/domain/repository/user-repository.interface";

vi.mock("@core/database/prisma/prisma-client", () => ({
  prisma: { user: { create: vi.fn() } },
}));

const prismaMock = vi.mocked(prisma, true);

function userRow(over: Record<string, unknown> = {}) {
  return {
    id: "user-1",
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

  it("creates only the user row and returns the hydrated entity", async () => {
    (prismaMock.user.create as ReturnType<typeof vi.fn>).mockResolvedValue(
      userRow(),
    );

    const result = await executeSignUpTransaction(data);

    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    expect(result.user.id).toBe("user-1");
    expect(result.user.email).toBe("ana@example.com");
  });

  it("maps a create failure (e.g. duplicate email) through mapPrismaError", async () => {
    (prismaMock.user.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("unique constraint"),
    );
    await expect(executeSignUpTransaction(data)).rejects.toBeInstanceOf(Error);
  });
});
