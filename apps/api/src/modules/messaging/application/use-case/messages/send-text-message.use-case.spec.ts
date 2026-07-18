import { SendTextMessageUseCase } from "./send-text-message.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { InMemoryOutboxRepository } from "@modules/messaging/test/in-memory-outbox.repository";
import { FakeWhatsAppGateway } from "@modules/devices/test/fake-whatsapp.gateway";
import { mockAppConfig } from "@test/mocks";
import { Device } from "@modules/devices/domain/entity/device.entity";
import type {
  DomainEvent,
  IDomainEventBus,
} from "@shared/provider/domain-event-bus.interface";
import {
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

class RecordingBus implements IDomainEventBus {
  public published: DomainEvent[] = [];
  publish(event: DomainEvent): void {
    this.published.push(event);
  }
  subscribe(): void {}
}

const setup = async () => {
  const devices = new InMemoryDevicesRepository();
  const outbox = new InMemoryOutboxRepository();
  const gateway = new FakeWhatsAppGateway();
  const config = mockAppConfig({ OUTBOX_TTL_HOURS: 24 });
  const bus = new RecordingBus();
  const device: Device = await devices.create({
    accountId: ACCOUNT_A,
    name: "d",
    webhookSecret: "s",
  });
  gateway.setConnected(device.id, true);
  const sut = new SendTextMessageUseCase(devices, outbox, gateway, config, bus);
  return { devices, outbox, gateway, device, bus, sut };
};

describe("SendTextMessageUseCase", () => {
  it("sends and returns 202 PENDING when the socket is alive", async () => {
    const { sut, device } = await setup();

    const out = await sut.execute({
      accountId: ACCOUNT_A,
      deviceId: device.id,
      phone: "5548999999999",
      text: "oi",
      idempotencyKey: "k1",
    });

    expect(out.status).toBe("PENDING");
    expect(out.messageId).toBeTruthy();
  });

  it("publishes message.sent (deviceId + messageId + phone, NO text) after a send", async () => {
    const { sut, device, bus } = await setup();

    const out = await sut.execute({
      accountId: ACCOUNT_A,
      deviceId: device.id,
      phone: "5548999999999",
      text: "segredo",
      idempotencyKey: "k1",
    });

    expect(bus.published).toEqual([
      {
        type: "message.sent",
        deviceId: device.id,
        messageId: out.messageId,
        phone: "5548999999999",
      },
    ]);
    // The text must never ride the event.
    expect(JSON.stringify(bus.published)).not.toContain("segredo");
  });

  it("does not publish message.sent on an idempotent replay", async () => {
    const { sut, device, bus } = await setup();
    const first = {
      accountId: ACCOUNT_A,
      deviceId: device.id,
      phone: "5548",
      text: "oi",
      idempotencyKey: "k",
    };
    await sut.execute(first);
    await sut.execute(first);

    expect(bus.published.filter((e) => e.type === "message.sent")).toHaveLength(
      1,
    );
  });

  it("throws DEVICE_NOT_FOUND for an unknown device", async () => {
    const { sut } = await setup();
    await expect(
      sut.execute({
        accountId: ACCOUNT_A,
        deviceId: "nope",
        phone: "5548",
        text: "oi",
        idempotencyKey: "k",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws DEVICE_NOT_FOUND for a device owned by another account (R3)", async () => {
    const { sut, device } = await setup();
    await expect(
      sut.execute({
        accountId: ACCOUNT_B,
        deviceId: device.id,
        phone: "5548",
        text: "oi",
        idempotencyKey: "k",
      }),
    ).rejects.toMatchObject({ code: ErrorCodes.DEVICE_NOT_FOUND });
  });

  it("throws DEVICE_OFFLINE when the socket is not connected (no queue)", async () => {
    const { sut, device, gateway } = await setup();
    gateway.setConnected(device.id, false);

    const promise = sut.execute({
      accountId: ACCOUNT_A,
      deviceId: device.id,
      phone: "5548",
      text: "oi",
      idempotencyKey: "k",
    });
    await expect(promise).rejects.toBeInstanceOf(ServiceUnavailableError);
    await expect(promise).rejects.toMatchObject({
      code: ErrorCodes.DEVICE_OFFLINE,
    });
  });

  it("replays the original on same key + same text (idempotent)", async () => {
    const { sut, device } = await setup();
    const first = await sut.execute({
      accountId: ACCOUNT_A,
      deviceId: device.id,
      phone: "5548",
      text: "oi",
      idempotencyKey: "k",
    });
    const second = await sut.execute({
      accountId: ACCOUNT_A,
      deviceId: device.id,
      phone: "5548",
      text: "oi",
      idempotencyKey: "k",
    });
    expect(second.messageId).toBe(first.messageId);
    expect(second.status).toBe("PENDING");
  });

  it("throws IDEMPOTENCY_KEY_CONFLICT on same key + different text", async () => {
    const { sut, device } = await setup();
    await sut.execute({
      accountId: ACCOUNT_A,
      deviceId: device.id,
      phone: "5548",
      text: "oi",
      idempotencyKey: "k",
    });

    const promise = sut.execute({
      accountId: ACCOUNT_A,
      deviceId: device.id,
      phone: "5548",
      text: "MUDOU",
      idempotencyKey: "k",
    });
    await expect(promise).rejects.toBeInstanceOf(ConflictError);
    await expect(promise).rejects.toMatchObject({
      code: ErrorCodes.IDEMPOTENCY_KEY_CONFLICT,
    });
  });

  it("throws NUMBER_NOT_ON_WHATSAPP when resolveJid returns null", async () => {
    const { sut, device, gateway } = await setup();
    gateway.setJid("000", null);

    const promise = sut.execute({
      accountId: ACCOUNT_A,
      deviceId: device.id,
      phone: "000",
      text: "oi",
      idempotencyKey: "k",
    });
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
    await expect(promise).rejects.toMatchObject({
      code: ErrorCodes.NUMBER_NOT_ON_WHATSAPP,
    });
  });

  it("still returns 202 PENDING + publishes message.sent when only the waMessageId stamp fails (message already sent)", async () => {
    const { sut, device, outbox, bus } = await setup();
    outbox.setWaMessageId = async () => {
      throw new Error("stamp db down");
    };

    // The gateway accepted → the caller must still get its 202 (a stamp failure
    // never fails a delivered send).
    const out = await sut.execute({
      accountId: ACCOUNT_A,
      deviceId: device.id,
      phone: "5548",
      text: "oi",
      idempotencyKey: "k",
    });
    expect(out.status).toBe("PENDING");

    // message.sent fired; the row must NOT be FAILED (the message went out).
    expect(bus.published.filter((e) => e.type === "message.sent")).toHaveLength(
      1,
    );
    expect((await outbox.findByIdempotencyKey(device.id, "k"))?.status).toBe(
      "PENDING",
    );
  });

  it("marks the outbox FAILED and re-throws when the send fails", async () => {
    const { sut, device, outbox, gateway } = await setup();
    gateway.sendText = async () => {
      throw new Error("socket died mid-send");
    };

    await expect(
      sut.execute({
        accountId: ACCOUNT_A,
        deviceId: device.id,
        phone: "5548",
        text: "oi",
        idempotencyKey: "k",
      }),
    ).rejects.toThrow("socket died");

    expect((await outbox.findByIdempotencyKey(device.id, "k"))?.status).toBe(
      "FAILED",
    );
  });
});
