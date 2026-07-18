import { HandleSessionConnectedUseCase } from "./handle-session-connected.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";

const ACCOUNT_A = "account-a";

describe("HandleSessionConnectedUseCase", () => {
  it("marks the device CONNECTED and stores its identifier", async () => {
    const devices = new InMemoryDevicesRepository();
    const { id } = await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, {
      name: "phone",
    });

    await new HandleSessionConnectedUseCase(devices).execute({
      deviceId: id,
      identifier: "5599",
    });

    const stored = await devices.findById(ACCOUNT_A, id);
    expect(stored?.status).toBe("CONNECTED");
    expect(stored?.identifier).toBe("5599");
    expect(stored?.lastConnectedAt).toBeInstanceOf(Date);
  });
});
