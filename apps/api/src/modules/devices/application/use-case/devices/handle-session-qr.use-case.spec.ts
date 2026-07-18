import { HandleSessionQrUseCase } from "./handle-session-qr.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";

const ACCOUNT_A = "account-a";

describe("HandleSessionQrUseCase", () => {
  it("marks the device QR_PENDING when a QR is emitted", async () => {
    const devices = new InMemoryDevicesRepository();
    const { id } = await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, {
      name: "phone",
    });
    await devices.updateStatus(id, "CONNECTING");

    await new HandleSessionQrUseCase(devices).execute({ deviceId: id });

    expect((await devices.findById(ACCOUNT_A, id))?.status).toBe("QR_PENDING");
  });
});
