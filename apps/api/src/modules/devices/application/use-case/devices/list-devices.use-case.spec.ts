import { ListDevicesUseCase } from "./list-devices.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";

describe("ListDevicesUseCase", () => {
  let devices: InMemoryDevicesRepository;

  beforeEach(() => {
    devices = new InMemoryDevicesRepository();
  });

  it("returns an empty array when there are no devices", async () => {
    const result = await new ListDevicesUseCase(devices).execute();
    expect(result).toEqual([]);
  });

  it("returns the public projection (no webhookSecret)", async () => {
    await new RegisterDeviceUseCase(devices).execute({ name: "a" });
    await new RegisterDeviceUseCase(devices).execute({ name: "b" });

    const result = await new ListDevicesUseCase(devices).execute();

    expect(result).toHaveLength(2);
    expect(result[0]).not.toHaveProperty("webhookSecret");
    expect(result.map((device) => device.name)).toContain("a");
  });
});
