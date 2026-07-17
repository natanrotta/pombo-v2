import { vi } from "vitest";
import { SignOutUseCase } from "./sign-out.use-case";
import { mockUserRepository } from "@test/mocks";

describe("SignOutUseCase", () => {
  let sut: SignOutUseCase;
  let userRepository: ReturnType<typeof mockUserRepository>;

  beforeEach(() => {
    userRepository = mockUserRepository();
    sut = new SignOutUseCase(userRepository);
  });

  it("should increment token version and clear refresh token", async () => {
    userRepository.incrementTokenVersion.mockResolvedValue(undefined);
    userRepository.clearRefreshToken.mockResolvedValue(undefined);

    await sut.execute("user-1");

    expect(userRepository.incrementTokenVersion).toHaveBeenCalledWith("user-1");
    expect(userRepository.clearRefreshToken).toHaveBeenCalledWith("user-1");
  });

  it("rejects and does not clear the refresh token if incrementTokenVersion fails", async () => {
    const err = new Error("increment failed");
    userRepository.incrementTokenVersion.mockRejectedValue(err);
    userRepository.clearRefreshToken.mockResolvedValue(undefined);

    await expect(sut.execute("user-1")).rejects.toBe(err);

    expect(userRepository.incrementTokenVersion).toHaveBeenCalledWith("user-1");
    expect(userRepository.clearRefreshToken).not.toHaveBeenCalled();
  });
});
