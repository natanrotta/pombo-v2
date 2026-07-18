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
import { ConflictError, NotFoundError } from "@shared/error";
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

  it("queues the message (202 PENDING, not 503) when the device is offline", async () => {
    const { sut, device, gateway, outbox, bus } = await setup();
    gateway.setConnected(device.id, false);

    const out = await sut.execute({
      accountId: ACCOUNT_A,
      deviceId: device.id,
      phone: "5548999999999",
      text: "oi",
      idempotencyKey: "k",
    });

    expect(out.status).toBe("PENDING");
    // Queued, not sent: no gateway send, no message.sent, no waMessageId yet.
    expect(gateway.sentTexts).toHaveLength(0);
    expect(bus.published.filter((e) => e.type === "message.sent")).toHaveLength(
      0,
    );
    const row = await outbox.findByIdempotencyKey(device.id, "k");
    expect(row?.status).toBe("PENDING");
    expect(row?.waMessageId).toBeNull();
    // The constructed jid is stored so the drain can send it on reconnect.
    expect(row?.toJid).toBe("5548999999999@s.whatsapp.net");
  });

  it("keeps the message queued (202, not FAILED) when the socket drops mid-send", async () => {
    const { sut, device, gateway, outbox } = await setup();
    // Passes the readiness check, but the send throws AND the device is now
    // offline → treat as a blip and leave it queued for the drain.
    gateway.sendText = async () => {
      gateway.setConnected(device.id, false);
      throw new Error("socket died mid-send");
    };

    const out = await sut.execute({
      accountId: ACCOUNT_A,
      deviceId: device.id,
      phone: "5548",
      text: "oi",
      idempotencyKey: "k",
    });

    expect(out.status).toBe("PENDING");
    expect((await outbox.findByIdempotencyKey(device.id, "k"))?.status).toBe(
      "PENDING",
    );
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

  it("returns 202 + publishes message.sent and moves the row to SERVER_ACK (not PENDING) when only the waMessageId stamp fails", async () => {
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

    // message.sent fired; the row must NOT be FAILED (it went out) and must NOT
    // stay PENDING (the reconnect drain would re-send it) → SERVER_ACK.
    expect(bus.published.filter((e) => e.type === "message.sent")).toHaveLength(
      1,
    );
    const row = await outbox.findByIdempotencyKey(device.id, "k");
    expect(row?.status).toBe("SERVER_ACK");
    // and therefore excluded from the drain queue (no double-send).
    expect(await outbox.findQueued(device.id, 100)).toHaveLength(0);
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
