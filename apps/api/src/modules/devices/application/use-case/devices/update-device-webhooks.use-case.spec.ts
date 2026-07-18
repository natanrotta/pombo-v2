import { UpdateDeviceWebhooksUseCase } from "./update-device-webhooks.use-case";
import { RegisterDeviceUseCase } from "./register-device.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { ErrorCodes } from "@shared/error/error-codes";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

const setup = async () => {
  const devices = new InMemoryDevicesRepository();
  const { id } = await new RegisterDeviceUseCase(devices).execute(ACCOUNT_A, {
    name: "phone",
  });
  const sut = new UpdateDeviceWebhooksUseCase(devices);
  return { devices, id, sut };
};

describe("UpdateDeviceWebhooksUseCase", () => {
  it("sets the provided URLs and leaves the rest untouched", async () => {
    const { id, sut } = await setup();

    const result = await sut.execute(ACCOUNT_A, id, {
      onConnect: "https://hook/connect",
      onSend: "https://hook/send",
    });

    expect(result.webhooks).toEqual({
      onConnect: "https://hook/connect",
      onDisconnect: null,
      onReceive: null,
      onMessageStatus: null,
      onSend: "https://hook/send",
    });
    // Never exposes the secret.
    expect(result).not.toHaveProperty("webhookSecret");
  });

  it("clears a URL when null is passed and leaves absent keys unchanged", async () => {
    const { id, sut } = await setup();
    await sut.execute(ACCOUNT_A, id, {
      onConnect: "https://hook/connect",
      onDisconnect: "https://hook/disconnect",
    });

    const result = await sut.execute(ACCOUNT_A, id, { onConnect: null });

    expect(result.webhooks.onConnect).toBeNull();
    expect(result.webhooks.onDisconnect).toBe("https://hook/disconnect");
  });

  it("leaves the webhookSecret untouched (spec §9.1 — secret intocado)", async () => {
    const { devices, id, sut } = await setup();
    const before = (await devices.findByIdInternal(id))?.webhookSecret;
    expect(before).toBeTruthy();

    await sut.execute(ACCOUNT_A, id, { onConnect: "https://hook" });

    const after = (await devices.findByIdInternal(id))?.webhookSecret;
    expect(after).toBe(before);
  });

  it("throws DEVICE_NOT_FOUND for a device owned by another account (R3)", async () => {
    const { id, sut } = await setup();

    await expect(
      sut.execute(ACCOUNT_B, id, { onConnect: "https://hook" }),
    ).rejects.toMatchObject({ code: ErrorCodes.DEVICE_NOT_FOUND });
  });
});
