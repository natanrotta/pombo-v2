import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { ConflictError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

describe("RegisterDeviceUseCase", () => {
  let devices: InMemoryDevicesRepository;
  let sut: RegisterDeviceUseCase;

  beforeEach(() => {
    devices = new InMemoryDevicesRepository();
    sut = new RegisterDeviceUseCase(devices);
  });

  it("creates a device and returns a fresh webhookSecret once", async () => {
    const out = await sut.execute({ name: "my-phone" });

    expect(out.id).toBeTruthy();
    expect(out.webhookSecret).toMatch(/^[0-9a-f]{64}$/);

    const stored = await devices.findById(out.id);
    expect(stored?.webhookSecret).toBe(out.webhookSecret);
    expect(stored?.status).toBe("DISCONNECTED");
    expect(stored?.identifier).toBeNull();
  });

  it("stores the webhookUrl when provided", async () => {
    const out = await sut.execute({
      name: "phone",
      webhookUrl: "https://hook",
    });
    const stored = await devices.findById(out.id);
    expect(stored?.webhookUrl).toBe("https://hook");
  });

  it("rejects a duplicate name with DEVICE_NAME_TAKEN", async () => {
    await sut.execute({ name: "dup" });

    await expect(sut.execute({ name: "dup" })).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(sut.execute({ name: "dup" })).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_NAME_TAKEN,
    });
  });
});
