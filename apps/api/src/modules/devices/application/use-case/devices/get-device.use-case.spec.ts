import { GetDeviceUseCase } from "./get-device.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

describe("GetDeviceUseCase", () => {
  let devices: InMemoryDevicesRepository;

  beforeEach(() => {
    devices = new InMemoryDevicesRepository();
  });

  it("returns the device projection when it exists", async () => {
    const { id } = await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, {
      name: "phone",
    });

    const result = await new GetDeviceUseCase(devices).execute(ACCOUNT_A, id);

    expect(result.id).toBe(id);
    expect(result.name).toBe("phone");
    expect(result).not.toHaveProperty("webhookSecret");
  });

  it("throws DEVICE_NOT_FOUND for an unknown id", async () => {
    const sut = new GetDeviceUseCase(devices);

    await expect(sut.execute(ACCOUNT_A, "nope")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(sut.execute(ACCOUNT_A, "nope")).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_NOT_FOUND,
    });
  });

  it("throws DEVICE_NOT_FOUND for a device owned by another account (R3)", async () => {
    const { id } = await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, {
      name: "phone",
    });
    const sut = new GetDeviceUseCase(devices);

    await expect(sut.execute(ACCOUNT_B, id)).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_NOT_FOUND,
    });
  });
});
