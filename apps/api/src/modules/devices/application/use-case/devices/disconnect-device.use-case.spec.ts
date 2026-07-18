import { DisconnectDeviceUseCase } from "./disconnect-device.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { FakeWhatsAppGateway } from "@modules/devices/test/fake-whatsapp.gateway";
import { NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

describe("DisconnectDeviceUseCase", () => {
  let devices: InMemoryDevicesRepository;
  let gateway: FakeWhatsAppGateway;

  beforeEach(() => {
    devices = new InMemoryDevicesRepository();
    gateway = new FakeWhatsAppGateway();
  });

  it("logs out and marks the device DISCONNECTED without deleting it", async () => {
    const { id } = await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, {
      name: "phone",
    });
    await devices.updateStatus(id, "CONNECTED");
    gateway.setConnected(id, true);

    const result = await new DisconnectDeviceUseCase(devices, gateway).execute(
      ACCOUNT_A,
      id,
    );

    expect(gateway.logoutCalls).toContain(id);
    expect(result.status).toBe("DISCONNECTED");

    const device = await devices.findById(ACCOUNT_A, id);
    expect(device).not.toBeNull();
    expect(device?.status).toBe("DISCONNECTED");
  });

  it("is idempotent when the device is already DISCONNECTED", async () => {
    const { id } = await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, {
      name: "phone",
    });
    await devices.updateStatus(id, "DISCONNECTED");
    const sut = new DisconnectDeviceUseCase(devices, gateway);

    const result = await sut.execute(ACCOUNT_A, id);

    expect(result.status).toBe("DISCONNECTED");
    expect(gateway.logoutCalls).toEqual([id]);
    const device = await devices.findById(ACCOUNT_A, id);
    expect(device?.status).toBe("DISCONNECTED");
  });

  it("throws DEVICE_NOT_FOUND for an unknown device", async () => {
    const sut = new DisconnectDeviceUseCase(devices, gateway);
    await expect(sut.execute(ACCOUNT_A, "nope")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(sut.execute(ACCOUNT_A, "nope")).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_NOT_FOUND,
    });
  });

  it("does not disconnect a device owned by another account (R3)", async () => {
    const { id } = await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, {
      name: "phone",
    });
    const sut = new DisconnectDeviceUseCase(devices, gateway);

    await expect(sut.execute(ACCOUNT_B, id)).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_NOT_FOUND,
    });
    expect(gateway.logoutCalls).not.toContain(id);
  });
});
