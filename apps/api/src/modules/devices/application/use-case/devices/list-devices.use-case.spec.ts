import { ListDevicesUseCase } from "./list-devices.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

describe("ListDevicesUseCase", () => {
  let devices: InMemoryDevicesRepository;

  beforeEach(() => {
    devices = new InMemoryDevicesRepository();
  });

  it("returns an empty array when the account has no devices", async () => {
    const result = await new ListDevicesUseCase(devices).execute(ACCOUNT_A);
    expect(result).toEqual([]);
  });

  it("returns the public projection (no webhookSecret)", async () => {
    await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, { name: "a" });
    await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, { name: "b" });

    const result = await new ListDevicesUseCase(devices).execute(ACCOUNT_A);

    expect(result).toHaveLength(2);
    expect(result[0]).not.toHaveProperty("webhookSecret");
    expect(result.map((device) => device.name)).toContain("a");
  });

  it("only lists devices owned by the requesting account (R1)", async () => {
    await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, { name: "a" });
    await new RegisterDeviceUseCase(devices).execute(ACCOUNT_B, { name: "b" });

    const result = await new ListDevicesUseCase(devices).execute(ACCOUNT_A);

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("a");
  });
});
