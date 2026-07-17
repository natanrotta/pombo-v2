import { HandleSessionConnectedUseCase } from "./handle-session-connected.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";

describe("HandleSessionConnectedUseCase", () => {
  it("marks the device CONNECTED and stores its identifier", async () => {
    const devices = new InMemoryDevicesRepository();
    const { id } = await new RegisterDeviceUseCase(devices).execute({
      name: "phone",
    });

    await new HandleSessionConnectedUseCase(devices).execute({
      deviceId: id,
      identifier: "5599",
    });

    const stored = await devices.findById(id);
    expect(stored?.status).toBe("CONNECTED");
    expect(stored?.identifier).toBe("5599");
    expect(stored?.lastConnectedAt).toBeInstanceOf(Date);
  });
});
