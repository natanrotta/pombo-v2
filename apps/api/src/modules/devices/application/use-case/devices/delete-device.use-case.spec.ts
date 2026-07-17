import { DeleteDeviceUseCase } from "./delete-device.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { FakeWhatsAppGateway } from "@modules/devices/test/fake-whatsapp.gateway";
import { NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

describe("DeleteDeviceUseCase", () => {
  let devices: InMemoryDevicesRepository;
  let gateway: FakeWhatsAppGateway;

  beforeEach(() => {
    devices = new InMemoryDevicesRepository();
    gateway = new FakeWhatsAppGateway();
  });

  it("logs out and deletes the device", async () => {
    const { id } = await new RegisterDeviceUseCase(devices).execute({
      name: "phone",
    });

    await new DeleteDeviceUseCase(devices, gateway).execute(id);

    expect(gateway.logoutCalls).toContain(id);
    expect(await devices.findById(id)).toBeNull();
  });

  it("throws DEVICE_NOT_FOUND for an unknown device", async () => {
    const sut = new DeleteDeviceUseCase(devices, gateway);
    await expect(sut.execute("nope")).rejects.toBeInstanceOf(NotFoundError);
    await expect(sut.execute("nope")).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_NOT_FOUND,
    });
  });
});
