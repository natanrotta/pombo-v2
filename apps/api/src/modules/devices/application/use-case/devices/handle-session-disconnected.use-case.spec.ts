import { HandleSessionDisconnectedUseCase } from "./handle-session-disconnected.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";

describe("HandleSessionDisconnectedUseCase", () => {
  it("marks the device DISCONNECTED", async () => {
    const devices = new InMemoryDevicesRepository();
    const { id } = await new RegisterDeviceUseCase(devices).execute({
      name: "phone",
    });
    await devices.updateStatus(id, "CONNECTED");

    await new HandleSessionDisconnectedUseCase(devices).execute({
      deviceId: id,
    });

    expect((await devices.findById(id))?.status).toBe("DISCONNECTED");
  });
});
