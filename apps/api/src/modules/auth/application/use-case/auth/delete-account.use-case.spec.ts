import { DeleteAccountUseCase } from "@modules/auth/application/use-case/auth/delete-account.use-case";
import { mockUserRepository } from "@test/mocks/repositories.mock";
import { makeUser } from "@modules/user/test/user.factory";
import { NotFoundError } from "@shared/error";

describe("DeleteAccountUseCase", () => {
  let sut: DeleteAccountUseCase;
  let userRepository: ReturnType<typeof mockUserRepository>;

  beforeEach(() => {
    userRepository = mockUserRepository();
    sut = new DeleteAccountUseCase(userRepository);
  });

  it("soft-deletes the authenticated user", async () => {
    userRepository.findById.mockResolvedValue(makeUser({ id: "user-1" }));

    await sut.execute("user-1");

    expect(userRepository.softDelete).toHaveBeenCalledWith("user-1");
  });

  it("throws NotFoundError when the user does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(sut.execute("missing")).rejects.toThrow(NotFoundError);
    expect(userRepository.softDelete).not.toHaveBeenCalled();
  });
});
