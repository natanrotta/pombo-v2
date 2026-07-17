import { GetDeviceQrUseCase } from "./get-device-qr.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { FakeWhatsAppGateway } from "@modules/devices/test/fake-whatsapp.gateway";
import { ErrorCodes } from "@shared/error/error-codes";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

const setup = async () => {
  const devices = new InMemoryDevicesRepository();
  const gateway = new FakeWhatsAppGateway();
  const { id } = await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, {
    name: "phone",
  });
  const sut = new GetDeviceQrUseCase(devices, gateway);
  return { devices, gateway, id, sut };
};

describe("GetDeviceQrUseCase", () => {
  it("returns the QR when the device is QR_PENDING", async () => {
    const { devices, gateway, id, sut } = await setup();
    await devices.updateStatus(id, "QR_PENDING");
    gateway.setQr(id, "qr-code-string");

    const result = await sut.execute(ACCOUNT_A, id);

    expect(result).toEqual({ status: "QR_PENDING", qr: "qr-code-string" });
  });

  it("returns qr:null when the device is not QR_PENDING (even if the gateway holds one)", async () => {
    const { devices, gateway, id, sut } = await setup();
    await devices.updateStatus(id, "CONNECTING");
    gateway.setQr(id, "stale-qr");

    const result = await sut.execute(ACCOUNT_A, id);

    expect(result).toEqual({ status: "CONNECTING", qr: null });
  });

  it("returns qr:null when QR_PENDING but the gateway has no QR yet", async () => {
    const { devices, id, sut } = await setup();
    await devices.updateStatus(id, "QR_PENDING");

    const result = await sut.execute(ACCOUNT_A, id);

    expect(result).toEqual({ status: "QR_PENDING", qr: null });
  });

  it("throws DEVICE_NOT_FOUND for a device owned by another account (R3)", async () => {
    const { id, sut } = await setup();

    await expect(sut.execute(ACCOUNT_B, id)).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_NOT_FOUND,
    });
  });
});
