import {
  SendEmailVerificationPinUseCase,
  EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
} from "./send-email-verification-pin.use-case";
import {
  mockAppConfig,
  mockUserRepository,
  mockEmailVerificationPinRepository,
  mockMailProvider,
  mockLoggerProvider,
} from "@test/mocks";
import { makeUser } from "@test/factories";
import { BadRequestError, TooManyRequestsError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

describe("SendEmailVerificationPinUseCase", () => {
  let sut: SendEmailVerificationPinUseCase;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let pinRepository: ReturnType<typeof mockEmailVerificationPinRepository>;
  let mailProvider: ReturnType<typeof mockMailProvider>;
  let logger: ReturnType<typeof mockLoggerProvider>;

  beforeEach(() => {
    userRepository = mockUserRepository();
    pinRepository = mockEmailVerificationPinRepository();
    mailProvider = mockMailProvider();
    logger = mockLoggerProvider();
    sut = new SendEmailVerificationPinUseCase(
      userRepository,
      pinRepository,
      mailProvider,
      logger,
      mockAppConfig(),
    );
  });

  it("generates a hashed PIN, persists it, and e-mails the code", async () => {
    const user = makeUser({
      id: "u-1",
      email: "john@test.com",
      emailVerified: false,
    });
    userRepository.findById.mockResolvedValue(user);
    pinRepository.findActiveByUserId.mockResolvedValue(null);

    await sut.execute({ userId: "u-1" });

    expect(pinRepository.deleteUnusedForUser).toHaveBeenCalledWith("u-1");
    expect(pinRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u-1",
        pinHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    // The stored value is a hash, never the raw 6-digit PIN.
    const storedHash = pinRepository.create.mock.calls[0]?.[0]
      .pinHash as string;
    expect(storedHash).toMatch(/^[a-f0-9]{64}$/);

    expect(mailProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "john@test.com" }),
    );
  });

  it("never logs the raw PIN — only the userId", async () => {
    const user = makeUser({ id: "u-1", emailVerified: false });
    userRepository.findById.mockResolvedValue(user);
    pinRepository.findActiveByUserId.mockResolvedValue(null);

    await sut.execute({ userId: "u-1" });

    expect(logger.info).toHaveBeenCalledWith(
      { userId: "u-1" },
      expect.any(String),
    );
    const loggedContexts = logger.info.mock.calls.map((c) =>
      JSON.stringify(c[0]),
    );
    expect(loggedContexts.some((ctx) => /pin/i.test(ctx))).toBe(false);
  });

  it("throws when the e-mail is already verified", async () => {
    const user = makeUser({ id: "u-1", emailVerified: true });
    userRepository.findById.mockResolvedValue(user);

    await expect(sut.execute({ userId: "u-1" })).rejects.toBeInstanceOf(
      BadRequestError,
    );
    await expect(sut.execute({ userId: "u-1" })).rejects.toMatchObject({
      code: ErrorCodes.AUTH_EMAIL_ALREADY_VERIFIED,
    });
    expect(pinRepository.create).not.toHaveBeenCalled();
  });

  it("enforces the resend cooldown server-side", async () => {
    const user = makeUser({ id: "u-1", emailVerified: false });
    userRepository.findById.mockResolvedValue(user);
    pinRepository.findActiveByUserId.mockResolvedValue({
      id: "pin-1",
      userId: "u-1",
      pinHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      usedAt: null,
      // Issued just now — inside the cooldown window.
      createdAt: new Date(Date.now() - 5_000),
    });

    await expect(sut.execute({ userId: "u-1" })).rejects.toBeInstanceOf(
      TooManyRequestsError,
    );
    expect(pinRepository.create).not.toHaveBeenCalled();
  });

  it("allows a resend once the cooldown has elapsed", async () => {
    const user = makeUser({ id: "u-1", emailVerified: false });
    userRepository.findById.mockResolvedValue(user);
    pinRepository.findActiveByUserId.mockResolvedValue({
      id: "pin-1",
      userId: "u-1",
      pinHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      usedAt: null,
      createdAt: new Date(
        Date.now() - (EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS + 5) * 1000,
      ),
    });

    await sut.execute({ userId: "u-1" });

    expect(pinRepository.create).toHaveBeenCalled();
    expect(mailProvider.send).toHaveBeenCalled();
  });
});
