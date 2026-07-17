import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { ConflictError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

describe("RegisterDeviceUseCase", () => {
  let devices: InMemoryDevicesRepository;
  let sut: RegisterDeviceUseCase;

  beforeEach(() => {
    devices = new InMemoryDevicesRepository();
    sut = new RegisterDeviceUseCase(devices);
  });

  it("creates a device and returns a fresh webhookSecret once", async () => {
    const out = await sut.execute(ACCOUNT_A, { name: "my-phone" });

    expect(out.id).toBeTruthy();
    expect(out.webhookSecret).toMatch(/^[0-9a-f]{64}$/);

    const stored = await devices.findById(ACCOUNT_A, out.id);
    expect(stored?.accountId).toBe(ACCOUNT_A);
    expect(stored?.webhookSecret).toBe(out.webhookSecret);
    expect(stored?.status).toBe("DISCONNECTED");
    expect(stored?.identifier).toBeNull();
  });

  it("stores the webhookUrl when provided", async () => {
    const out = await sut.execute(ACCOUNT_A, {
      name: "phone",
      webhookUrl: "https://hook",
    });
    const stored = await devices.findById(ACCOUNT_A, out.id);
    expect(stored?.webhookUrl).toBe("https://hook");
  });

  it("rejects a duplicate name within the same account", async () => {
    await sut.execute(ACCOUNT_A, { name: "dup" });

    await expect(
      sut.execute(ACCOUNT_A, { name: "dup" }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(sut.execute(ACCOUNT_A, { name: "dup" })).rejects.toMatchObject(
      { code: ErrorCodes.DEVICE_NAME_TAKEN },
    );
  });

  it("allows the same device name across different accounts", async () => {
    const a = await sut.execute(ACCOUNT_A, { name: "shared-name" });
    const b = await sut.execute(ACCOUNT_B, { name: "shared-name" });

    expect(a.id).not.toBe(b.id);
    expect((await devices.findById(ACCOUNT_A, a.id))?.name).toBe("shared-name");
    expect((await devices.findById(ACCOUNT_B, b.id))?.name).toBe("shared-name");
  });
});
