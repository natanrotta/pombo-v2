import { DispatchWebhookUseCase } from "./dispatch-webhook.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { FakeWebhookSender } from "@modules/webhooks/test/fake-webhook-sender";

const ACCOUNT_A = "account-a";

const makeDeviceWithHooks = async (
  devices: InMemoryDevicesRepository,
  webhooks: Partial<{
    onConnect: string;
    onDisconnect: string;
    onReceive: string;
    onMessageStatus: string;
    onSend: string;
  }>,
) => {
  const device = await devices.create({
    accountId: ACCOUNT_A,
    name: "d",
    webhookSecret: "sekret",
  });
  await devices.updateWebhooks(ACCOUNT_A, device.id, webhooks);
  return device;
};

describe("DispatchWebhookUseCase", () => {
  it("is a no-op when the device has no URL for that event (webhooks are opt-in)", async () => {
    const devices = new InMemoryDevicesRepository();
    // Only onConnect is set; a message.status event has no URL → nothing sent.
    const device = await makeDeviceWithHooks(devices, {
      onConnect: "https://hook/connect",
    });
    const sender = new FakeWebhookSender();

    await new DispatchWebhookUseCase(devices, sender).execute({
      type: "message.status",
      deviceId: device.id,
      data: { messageId: "m1", status: "READ" },
    });

    expect(sender.sent).toEqual([]);
  });

  it("is a no-op for an unknown device", async () => {
    const devices = new InMemoryDevicesRepository();
    const sender = new FakeWebhookSender();

    await new DispatchWebhookUseCase(devices, sender).execute({
      type: "device.logged_out",
      deviceId: "nope",
      data: {},
    });

    expect(sender.sent).toEqual([]);
  });

  it("routes device.connected to the on_connect URL and signs with the device secret", async () => {
    const devices = new InMemoryDevicesRepository();
    const device = await makeDeviceWithHooks(devices, {
      onConnect: "https://hook/connect",
      onDisconnect: "https://hook/disconnect",
    });
    const sender = new FakeWebhookSender();

    await new DispatchWebhookUseCase(devices, sender).execute({
      type: "device.connected",
      deviceId: device.id,
      data: { identifier: "5599" },
    });

    expect(sender.sent).toHaveLength(1);
    const delivery = sender.sent[0]!;
    expect(delivery.url).toBe("https://hook/connect");
    expect(delivery.secret).toBe("sekret");
    expect(delivery.event).toMatchObject({
      type: "device.connected",
      deviceId: device.id,
      data: { identifier: "5599" },
    });
    expect(delivery.event.eventId).toMatch(/^evt_/);
    expect(delivery.event.timestamp).toBeTruthy();
  });

  it("routes device.disconnected AND device.logged_out to the on_disconnect URL", async () => {
    const devices = new InMemoryDevicesRepository();
    const device = await makeDeviceWithHooks(devices, {
      onDisconnect: "https://hook/disconnect",
    });
    const sender = new FakeWebhookSender();
    const sut = new DispatchWebhookUseCase(devices, sender);

    await sut.execute({
      type: "device.disconnected",
      deviceId: device.id,
      data: { reason: "closed" },
    });
    await sut.execute({
      type: "device.logged_out",
      deviceId: device.id,
      data: {},
    });

    expect(sender.sent.map((d) => d.url)).toEqual([
      "https://hook/disconnect",
      "https://hook/disconnect",
    ]);
  });

  it("routes message.sent to the on_send URL", async () => {
    const devices = new InMemoryDevicesRepository();
    const device = await makeDeviceWithHooks(devices, {
      onSend: "https://hook/send",
    });
    const sender = new FakeWebhookSender();

    await new DispatchWebhookUseCase(devices, sender).execute({
      type: "message.sent",
      deviceId: device.id,
      data: { messageId: "m1", phone: "5599" },
    });

    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0]!.url).toBe("https://hook/send");
  });
});
