import { ConnectDeviceUseCase } from "./connect-device.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { FakeWhatsAppGateway } from "@modules/devices/test/fake-whatsapp.gateway";
import { ConflictError, NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

describe("ConnectDeviceUseCase", () => {
  let devices: InMemoryDevicesRepository;
  let gateway: FakeWhatsAppGateway;

  beforeEach(() => {
    devices = new InMemoryDevicesRepository();
    gateway = new FakeWhatsAppGateway();
  });

  const register = (name = "phone") =>
    new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, { name });

  it("starts a connection and marks the device CONNECTING", async () => {
    const { id } = await register();

    const out = await new ConnectDeviceUseCase(devices, gateway).execute(
      ACCOUNT_A,
      id,
    );

    expect(out.status).toBe("CONNECTING");
    expect(gateway.connectCalls).toContain(id);
  });

  it("throws DEVICE_NOT_FOUND for an unknown device", async () => {
    const sut = new ConnectDeviceUseCase(devices, gateway);
    await expect(sut.execute(ACCOUNT_A, "nope")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(sut.execute(ACCOUNT_A, "nope")).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_NOT_FOUND,
    });
  });

  it("throws DEVICE_NOT_FOUND for a device owned by another account (R3)", async () => {
    const { id } = await register();
    const sut = new ConnectDeviceUseCase(devices, gateway);

    await expect(sut.execute(ACCOUNT_B, id)).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_NOT_FOUND,
    });
    expect(gateway.connectCalls).not.toContain(id);
  });

  it("throws WA_GATEWAY_DISABLED when the gateway is disabled", async () => {
    const { id } = await register();
    gateway.setEnabled(false);
    const sut = new ConnectDeviceUseCase(devices, gateway);

    await expect(sut.execute(ACCOUNT_A, id)).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(sut.execute(ACCOUNT_A, id)).rejects.toMatchObject({
      code: ErrorCodes.WA_GATEWAY_DISABLED,
    });
    expect(gateway.connectCalls).not.toContain(id);
  });

  it("throws DEVICE_ALREADY_CONNECTED when the gateway reports the socket live", async () => {
    const { id } = await register();
    gateway.setConnected(id, true);
    const sut = new ConnectDeviceUseCase(devices, gateway);

    await expect(sut.execute(ACCOUNT_A, id)).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(sut.execute(ACCOUNT_A, id)).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_ALREADY_CONNECTED,
    });
  });

  it("throws DEVICE_ALREADY_CONNECTED when the stored status is CONNECTED", async () => {
    const { id } = await register();
    await devices.updateStatus(id, "CONNECTED");
    const sut = new ConnectDeviceUseCase(devices, gateway);

    await expect(sut.execute(ACCOUNT_A, id)).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_ALREADY_CONNECTED,
    });
  });
});
