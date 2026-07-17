import { createHash } from "crypto";
import { ResetPasswordUseCase } from "./reset-password.use-case";
import {
  mockUserRepository,
  mockPasswordResetTokenRepository,
  mockHashProvider,
} from "@test/mocks";
import { makeUser } from "@test/factories";
import { BadRequestError, UnauthorizedError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

const RAW_TOKEN = "raw-token-abc123";
const TOKEN_HASH = createHash("sha256").update(RAW_TOKEN).digest("hex");
const VALID_PASSWORD = "Str0ng!Password";

function makeValidRecord(
  overrides: Partial<{ usedAt: Date | null; expiresAt: Date }> = {},
) {
  return {
    id: "token-1",
    userId: "user-1",
    tokenHash: TOKEN_HASH,
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60_000),
    usedAt: overrides.usedAt ?? null,
    createdAt: new Date(),
  };
}

describe("ResetPasswordUseCase", () => {
  let sut: ResetPasswordUseCase;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let tokenRepository: ReturnType<typeof mockPasswordResetTokenRepository>;
  let hashProvider: ReturnType<typeof mockHashProvider>;

  beforeEach(() => {
    userRepository = mockUserRepository();
    tokenRepository = mockPasswordResetTokenRepository();
    hashProvider = mockHashProvider();
    vi.clearAllMocks();
    sut = new ResetPasswordUseCase(
      userRepository,
      tokenRepository,
      hashProvider,
    );
  });

  it("resets the password, marks the token used, and invalidates sessions", async () => {
    const user = makeUser({ id: "user-1", password: "old" });
    tokenRepository.findByTokenHash.mockResolvedValue(makeValidRecord());
    userRepository.findById.mockResolvedValue(user);
    hashProvider.hash.mockResolvedValue("new-hashed");

    await sut.execute({ token: RAW_TOKEN, password: VALID_PASSWORD });

    expect(tokenRepository.findByTokenHash).toHaveBeenCalledWith(TOKEN_HASH);
    expect(hashProvider.hash).toHaveBeenCalledWith(VALID_PASSWORD);
    expect(userRepository.update).toHaveBeenCalledWith("user-1", {
      password: "new-hashed",
    });
    expect(tokenRepository.markAsUsed).toHaveBeenCalledWith("token-1");
    expect(tokenRepository.invalidateAllForUser).toHaveBeenCalledWith("user-1");
    expect(userRepository.incrementTokenVersion).toHaveBeenCalledWith("user-1");
    expect(userRepository.clearRefreshToken).toHaveBeenCalledWith("user-1");
  });

  it("throws INVALID when the token does not exist", async () => {
    tokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(
      sut.execute({ token: RAW_TOKEN, password: VALID_PASSWORD }),
    ).rejects.toMatchObject({
      code: ErrorCodes.AUTH_PASSWORD_RESET_TOKEN_INVALID,
    });
    await expect(
      sut.execute({ token: RAW_TOKEN, password: VALID_PASSWORD }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("throws USED when the token was already consumed", async () => {
    tokenRepository.findByTokenHash.mockResolvedValue(
      makeValidRecord({ usedAt: new Date() }),
    );

    await expect(
      sut.execute({ token: RAW_TOKEN, password: VALID_PASSWORD }),
    ).rejects.toMatchObject({
      code: ErrorCodes.AUTH_PASSWORD_RESET_TOKEN_USED,
    });
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it("throws EXPIRED when the token is past its expiration", async () => {
    tokenRepository.findByTokenHash.mockResolvedValue(
      makeValidRecord({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(
      sut.execute({ token: RAW_TOKEN, password: VALID_PASSWORD }),
    ).rejects.toMatchObject({
      code: ErrorCodes.AUTH_PASSWORD_RESET_TOKEN_EXPIRED,
    });
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it("throws when the user cannot be found (defense in depth)", async () => {
    tokenRepository.findByTokenHash.mockResolvedValue(makeValidRecord());
    userRepository.findById.mockResolvedValue(null);

    await expect(
      sut.execute({ token: RAW_TOKEN, password: VALID_PASSWORD }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(userRepository.update).not.toHaveBeenCalled();
  });
});
