import { HandleSessionDisconnectedUseCase } from "./handle-session-disconnected.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";

const ACCOUNT_A = "account-a";

describe("HandleSessionDisconnectedUseCase", () => {
  it("marks the device DISCONNECTED", async () => {
    const devices = new InMemoryDevicesRepository();
    const { id } = await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, {
      name: "phone",
    });
    await devices.updateStatus(id, "CONNECTED");

    await new HandleSessionDisconnectedUseCase(devices).execute({
      deviceId: id,
    });

    expect((await devices.findById(ACCOUNT_A, id))?.status).toBe(
      "DISCONNECTED",
    );
  });
});
