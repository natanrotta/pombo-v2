import { DeleteDeviceUseCase } from "./delete-device.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { FakeWhatsAppGateway } from "@modules/devices/test/fake-whatsapp.gateway";
import { NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

describe("DeleteDeviceUseCase", () => {
  let devices: InMemoryDevicesRepository;
  let gateway: FakeWhatsAppGateway;

  beforeEach(() => {
    devices = new InMemoryDevicesRepository();
    gateway = new FakeWhatsAppGateway();
  });

  it("logs out and deletes the device", async () => {
    const { id } = await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, {
      name: "phone",
    });

    await new DeleteDeviceUseCase(devices, gateway).execute(ACCOUNT_A, id);

    expect(gateway.logoutCalls).toContain(id);
    expect(await devices.findById(ACCOUNT_A, id)).toBeNull();
  });

  it("throws DEVICE_NOT_FOUND for an unknown device", async () => {
    const sut = new DeleteDeviceUseCase(devices, gateway);
    await expect(sut.execute(ACCOUNT_A, "nope")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(sut.execute(ACCOUNT_A, "nope")).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_NOT_FOUND,
    });
  });

  it("does not delete a device owned by another account (R3)", async () => {
    const { id } = await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, {
      name: "phone",
    });
    const sut = new DeleteDeviceUseCase(devices, gateway);

    await expect(sut.execute(ACCOUNT_B, id)).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_NOT_FOUND,
    });
    expect(gateway.logoutCalls).not.toContain(id);
    expect(await devices.findById(ACCOUNT_A, id)).not.toBeNull();
  });
});
