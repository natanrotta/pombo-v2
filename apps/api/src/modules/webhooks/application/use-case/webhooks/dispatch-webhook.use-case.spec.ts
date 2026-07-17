import { DispatchWebhookUseCase } from "./dispatch-webhook.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { FakeWebhookSender } from "@modules/webhooks/test/fake-webhook-sender";

describe("DispatchWebhookUseCase", () => {
  it("is a no-op when the device has no webhookUrl (webhooks are opt-in)", async () => {
    const devices = new InMemoryDevicesRepository();
    const device = await devices.create({
      name: "d",
      webhookUrl: null,
      webhookSecret: "s",
    });
    const sender = new FakeWebhookSender();

    await new DispatchWebhookUseCase(devices, sender).execute({
      type: "device.logged_out",
      deviceId: device.id,
      data: {},
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

  it("sends with the device url + per-device secret and stamps eventId/timestamp", async () => {
    const devices = new InMemoryDevicesRepository();
    const device = await devices.create({
      name: "d",
      webhookUrl: "http://hook",
      webhookSecret: "sekret",
    });
    const sender = new FakeWebhookSender();

    await new DispatchWebhookUseCase(devices, sender).execute({
      type: "device.connected",
      deviceId: device.id,
      data: { identifier: "5599" },
    });

    expect(sender.sent).toHaveLength(1);
    const delivery = sender.sent[0]!;
    expect(delivery.url).toBe("http://hook");
    expect(delivery.secret).toBe("sekret");
    expect(delivery.event).toMatchObject({
      type: "device.connected",
      deviceId: device.id,
      data: { identifier: "5599" },
    });
    expect(delivery.event.eventId).toMatch(/^evt_/);
    expect(delivery.event.timestamp).toBeTruthy();
  });
});
