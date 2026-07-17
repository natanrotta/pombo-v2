import { RefreshTokenUseCase } from "./refresh-token.use-case";
import { mockUserRepository, mockJwtProvider } from "@test/mocks";
import { makeUser } from "@test/factories";
import { UnauthorizedError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

describe("RefreshTokenUseCase", () => {
  let sut: RefreshTokenUseCase;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let jwtProvider: ReturnType<typeof mockJwtProvider>;

  beforeEach(() => {
    userRepository = mockUserRepository();
    jwtProvider = mockJwtProvider();
    sut = new RefreshTokenUseCase(userRepository, jwtProvider);
    jwtProvider.generateTokenPair.mockReturnValue({
      token: "new-token",
      refreshToken: "new-refresh",
      tokenExpiresAt: new Date(),
      refreshTokenExpiresAt: new Date(),
    });
    userRepository.setRefreshTokenHash.mockResolvedValue(undefined);
  });

  it("rotates the tokens for the resolved user", async () => {
    const user = makeUser({
      refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    });
    userRepository.findByRefreshTokenHash.mockResolvedValue(user);

    const result = await sut.execute("old-refresh-token");

    expect(result.token).toBe("new-token");
    expect(result.refreshToken).toBe("new-refresh");
    expect(jwtProvider.hashRefreshToken).toHaveBeenCalledWith(
      "old-refresh-token",
    );
    expect(userRepository.findByRefreshTokenHash).toHaveBeenCalledWith(
      "hashed-old-refresh-token",
    );
    expect(userRepository.setRefreshTokenHash).toHaveBeenCalledWith(
      user.id,
      "hashed-new-refresh",
      expect.any(Date),
    );
    expect(jwtProvider.generateTokenPair).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        tokenVersion: user.tokenVersion,
      }),
    );
  });

  it("throws UnauthorizedError when refresh token not found", async () => {
    userRepository.findByRefreshTokenHash.mockResolvedValue(null);

    await expect(sut.execute("invalid-token")).rejects.toThrow(
      UnauthorizedError,
    );
    await expect(sut.execute("invalid-token")).rejects.toMatchObject({
      code: ErrorCodes.AUTH_TOKEN_INVALID,
    });
  });

  it("throws UnauthorizedError when refresh token is expired", async () => {
    const user = makeUser({
      refreshTokenExpiresAt: new Date(Date.now() - 60_000),
    });
    userRepository.findByRefreshTokenHash.mockResolvedValue(user);
    userRepository.clearRefreshToken.mockResolvedValue(undefined);

    await expect(sut.execute("expired-token")).rejects.toThrow(
      UnauthorizedError,
    );
    await expect(sut.execute("expired-token")).rejects.toMatchObject({
      code: ErrorCodes.AUTH_TOKEN_EXPIRED,
    });
  });

  it("throws UnauthorizedError when user is not active", async () => {
    const user = makeUser({
      status: "PENDING",
      refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    });
    userRepository.findByRefreshTokenHash.mockResolvedValue(user);

    await expect(sut.execute("valid-token")).rejects.toThrow(UnauthorizedError);
  });
});
