import { SignUpUseCase } from "./sign-up.use-case";
import {
  mockUserRepository,
  mockHashProvider,
  mockJwtProvider,
} from "@test/mocks";
import { makeUser } from "@test/factories";
import { ConflictError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";
import { JWT_SCOPES } from "@modules/auth/constant/jwt-scopes";

describe("SignUpUseCase", () => {
  let sut: SignUpUseCase;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let hashProvider: ReturnType<typeof mockHashProvider>;
  let jwtProvider: ReturnType<typeof mockJwtProvider>;

  beforeEach(() => {
    userRepository = mockUserRepository();
    hashProvider = mockHashProvider();
    jwtProvider = mockJwtProvider();
    sut = new SignUpUseCase(userRepository, hashProvider, jwtProvider);
  });

  it("creates an unverified user and returns an email:verify-scoped token", async () => {
    const user = makeUser({ id: "u-1", email: "john@test.com" });

    userRepository.findByEmail.mockResolvedValue(null);
    hashProvider.hash.mockResolvedValue("hashed-password");
    jwtProvider.issueRefreshCredential.mockReturnValue({
      refreshToken: "refresh-token",
      tokenExpiresAt: new Date(),
      refreshTokenExpiresAt: new Date(),
    });
    userRepository.signUpTransaction.mockResolvedValue({ user });
    jwtProvider.signScoped.mockReturnValue({
      token: "verify-email-token",
      expiresAt: new Date(),
    });

    const result = await sut.execute({
      name: "John",
      email: "john@test.com",
      password: "Str0ng!Pass",
    });

    expect(hashProvider.hash).toHaveBeenCalledWith("Str0ng!Pass");
    expect(userRepository.signUpTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "John",
        email: "john@test.com",
        password: "hashed-password",
        status: "ACTIVE",
      }),
    );
    expect(
      userRepository.signUpTransaction.mock.calls[0]?.[0].emailVerified,
    ).toBeUndefined();

    // A scoped verify-email token is issued — NOT a final session token.
    expect(jwtProvider.sign).not.toHaveBeenCalled();
    expect(jwtProvider.signScoped).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u-1" }),
      JWT_SCOPES.EmailVerification,
      expect.any(Number),
    );
    expect(result).toEqual({
      requiresEmailVerification: true,
      token: "verify-email-token",
      email: "john@test.com",
    });
  });

  it("throws ConflictError when email already exists", async () => {
    const existingUser = makeUser();
    userRepository.findByEmail.mockResolvedValue(existingUser);

    await expect(
      sut.execute({
        name: "John",
        email: existingUser.email,
        password: "Str0ng!Pass",
      }),
    ).rejects.toThrow(ConflictError);
    await expect(
      sut.execute({
        name: "John",
        email: existingUser.email,
        password: "Str0ng!Pass",
      }),
    ).rejects.toMatchObject({ code: ErrorCodes.AUTH_EMAIL_ALREADY_EXISTS });
  });
});
