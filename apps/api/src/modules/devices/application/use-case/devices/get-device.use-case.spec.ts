import { GetDeviceUseCase } from "./get-device.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

describe("GetDeviceUseCase", () => {
  let devices: InMemoryDevicesRepository;

  beforeEach(() => {
    devices = new InMemoryDevicesRepository();
  });

  it("returns the device projection when it exists", async () => {
    const { id } = await new RegisterDeviceUseCase(devices).execute({
      name: "phone",
    });

    const result = await new GetDeviceUseCase(devices).execute(id);

    expect(result.id).toBe(id);
    expect(result.name).toBe("phone");
    expect(result).not.toHaveProperty("webhookSecret");
  });

  it("throws DEVICE_NOT_FOUND for an unknown id", async () => {
    const sut = new GetDeviceUseCase(devices);

    await expect(sut.execute("nope")).rejects.toBeInstanceOf(NotFoundError);
    await expect(sut.execute("nope")).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_NOT_FOUND,
    });
  });
});
