import { SendRichMessageUseCase } from "./send-rich-message.use-case";
import { DrainOutboxUseCase } from "./drain-outbox.use-case";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { InMemoryOutboxRepository } from "@modules/messaging/test/in-memory-outbox.repository";
import { FakeWhatsAppGateway } from "@modules/devices/test/fake-whatsapp.gateway";
import { TokenBucketSendRateLimiter } from "@modules/messaging/infrastructure/provider/token-bucket-send-rate-limiter";
import type { ISendRateLimiter } from "@modules/messaging/domain/provider/send-rate-limiter.interface";
import {
  mockAppConfig,
  mockLoggerProvider,
  mockSendRateLimiter,
} from "@test/mocks";
import { Device } from "@modules/devices/domain/entity/device.entity";
import type {
  DomainEvent,
  IDomainEventBus,
} from "@shared/provider/domain-event-bus.interface";
import { ConflictError, NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";
import type { SendRichInput } from "@modules/messaging/application/dto/message.dto";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

class RecordingBus implements IDomainEventBus {
  public published: DomainEvent[] = [];
  publish(event: DomainEvent): void {
    this.published.push(event);
  }
  subscribe(): void {}
}

const setup = async (rateLimiter: ISendRateLimiter = mockSendRateLimiter()) => {
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
  const drainOutbox = new DrainOutboxUseCase(
    outbox,
    gateway,
    bus,
    rateLimiter,
    mockLoggerProvider(),
  );
  const sut = new SendRichMessageUseCase(
    devices,
    outbox,
    gateway,
    config,
    bus,
    rateLimiter,
    drainOutbox,
  );
  const imageInput = (
    overrides: Partial<SendRichInput> = {},
  ): SendRichInput => ({
    accountId: ACCOUNT_A,
    deviceId: device.id,
    phone: "5548999999999",
    idempotencyKey: "k1",
    type: "image",
    payload: { image: "https://ex.com/a.png", caption: "hi" },
    ...overrides,
  });
  return {
    devices,
    outbox,
    gateway,
    device,
    bus,
    sut,
    drainOutbox,
    imageInput,
  };
};

describe("SendRichMessageUseCase", () => {
  it("sends via the type-matched gateway method and returns 202 PENDING", async () => {
    const { sut, gateway, imageInput } = await setup();

    const out = await sut.execute(imageInput());

    expect(out.status).toBe("PENDING");
    expect(out.messageId).toBeTruthy();
    // Dispatched as an image — never as text.
    expect(gateway.sentTexts).toHaveLength(0);
    expect(gateway.sentRich).toEqual([
      {
        deviceId: expect.any(String),
        jid: "5548999999999@s.whatsapp.net",
        type: "image",
        payload: { image: "https://ex.com/a.png", caption: "hi" },
      },
    ]);
  });

  it.each([
    ["image", { image: "https://ex.com/a.png" }],
    ["audio", { audio: "https://ex.com/a.ogg" }],
    ["video", { video: "https://ex.com/a.mp4", caption: "c" }],
    ["document", { document: "https://ex.com/a.pdf", fileName: "a.pdf" }],
    ["pix", { pixKey: "chave@ex.com", type: "EMAIL" }],
    [
      "list",
      {
        message: "escolha",
        optionList: {
          title: "t",
          buttonLabel: "ver",
          options: [{ title: "o1", id: "1" }],
        },
      },
    ],
  ] as const)(
    "dispatches %s to the matching gateway method",
    async (type, payload) => {
      const { sut, gateway, imageInput } = await setup();

      await sut.execute(imageInput({ type, payload }));

      expect(gateway.sentRich).toHaveLength(1);
      expect(gateway.sentRich[0]?.type).toBe(type);
      expect(gateway.sentRich[0]?.payload).toEqual(payload);
    },
  );

  it("publishes message.sent (deviceId + messageId + phone) after a send", async () => {
    const { sut, bus, device, imageInput } = await setup();

    const out = await sut.execute(imageInput());

    expect(bus.published).toEqual([
      {
        type: "message.sent",
        deviceId: device.id,
        messageId: out.messageId,
        phone: "5548999999999",
      },
    ]);
  });

  it("queues (202 PENDING, no send) when the device is offline", async () => {
    const { sut, gateway, outbox, bus, device, imageInput } = await setup();
    gateway.setConnected(device.id, false);

    const out = await sut.execute(imageInput());

    expect(out.status).toBe("PENDING");
    expect(gateway.sentRich).toHaveLength(0);
    expect(bus.published.filter((e) => e.type === "message.sent")).toHaveLength(
      0,
    );
    const row = await outbox.findByIdempotencyKey(device.id, "k1");
    expect(row?.status).toBe("PENDING");
    expect(row?.type).toBe("image");
    expect(row?.payload).toEqual({
      image: "https://ex.com/a.png",
      caption: "hi",
    });
    expect(row?.text).toBeNull();
    expect(row?.toJid).toBe("5548999999999@s.whatsapp.net");
  });

  it("queues (202) and does NOT send now when the rate limit is exhausted", async () => {
    const limiter = new TokenBucketSendRateLimiter(1, 60000);
    const { sut, gateway, outbox, device, drainOutbox, imageInput } =
      await setup(limiter);
    const drainCalls: string[] = [];
    drainOutbox.execute = async ({ deviceId }) => {
      drainCalls.push(deviceId);
    };

    await sut.execute(imageInput({ idempotencyKey: "k1" }));
    expect(gateway.sentRich).toHaveLength(1); // had a token → sent

    const out = await sut.execute(imageInput({ idempotencyKey: "k2" }));
    expect(out.status).toBe("PENDING");
    expect(gateway.sentRich).toHaveLength(1); // no token → NOT sent
    const row = await outbox.findByIdempotencyKey(device.id, "k2");
    expect(row?.waMessageId).toBeNull();
    expect(drainCalls).toEqual([device.id]);
  });

  it("replays the original on same key + identical payload (order-independent)", async () => {
    const { sut, imageInput } = await setup();
    const first = await sut.execute(
      imageInput({ payload: { image: "u", caption: "c" } }),
    );
    // Same content, keys in a different order → still idempotent.
    const second = await sut.execute(
      imageInput({ payload: { caption: "c", image: "u" } }),
    );
    expect(second.messageId).toBe(first.messageId);
    expect(second.status).toBe("PENDING");
  });

  it("throws IDEMPOTENCY_KEY_CONFLICT on same key + different payload", async () => {
    const { sut, imageInput } = await setup();
    await sut.execute(imageInput({ payload: { image: "u1" } }));

    const promise = sut.execute(imageInput({ payload: { image: "u2" } }));
    await expect(promise).rejects.toBeInstanceOf(ConflictError);
    await expect(promise).rejects.toMatchObject({
      code: ErrorCodes.IDEMPOTENCY_KEY_CONFLICT,
    });
  });

  it("throws IDEMPOTENCY_KEY_CONFLICT on same key + different type", async () => {
    const { sut, imageInput } = await setup();
    await sut.execute(imageInput({ type: "image", payload: { image: "u" } }));

    const promise = sut.execute(
      imageInput({ type: "video", payload: { video: "u" } }),
    );
    await expect(promise).rejects.toMatchObject({
      code: ErrorCodes.IDEMPOTENCY_KEY_CONFLICT,
    });
  });

  it("throws DEVICE_NOT_FOUND for an unknown device", async () => {
    const { sut, imageInput } = await setup();
    await expect(
      sut.execute(imageInput({ deviceId: "nope" })),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws DEVICE_NOT_FOUND for a device owned by another account (R3)", async () => {
    const { sut, imageInput } = await setup();
    await expect(
      sut.execute(imageInput({ accountId: ACCOUNT_B })),
    ).rejects.toMatchObject({ code: ErrorCodes.DEVICE_NOT_FOUND });
  });

  it("throws NUMBER_NOT_ON_WHATSAPP when resolveJid returns null", async () => {
    const { sut, gateway, imageInput } = await setup();
    gateway.setJid("000", null);

    await expect(
      sut.execute(imageInput({ phone: "000" })),
    ).rejects.toMatchObject({ code: ErrorCodes.NUMBER_NOT_ON_WHATSAPP });
  });

  it("marks the outbox FAILED and re-throws when the send fails while connected", async () => {
    const { sut, outbox, gateway, device, imageInput } = await setup();
    gateway.failTypes.add("image");

    await expect(sut.execute(imageInput())).rejects.toThrow("send failed");
    expect((await outbox.findByIdempotencyKey(device.id, "k1"))?.status).toBe(
      "FAILED",
    );
  });

  it("keeps the message queued (202, not FAILED) when the socket drops mid-send", async () => {
    const { sut, outbox, gateway, device, imageInput } = await setup();
    gateway.sendImage = async () => {
      gateway.setConnected(device.id, false);
      throw new Error("socket died mid-send");
    };

    const out = await sut.execute(imageInput());

    expect(out.status).toBe("PENDING");
    expect((await outbox.findByIdempotencyKey(device.id, "k1"))?.status).toBe(
      "PENDING",
    );
  });

  it("moves the row to SERVER_ACK (not PENDING) when only the waMessageId stamp fails", async () => {
    const { sut, outbox, device, imageInput } = await setup();
    outbox.setWaMessageId = async () => {
      throw new Error("stamp db down");
    };

    const out = await sut.execute(imageInput());
    expect(out.status).toBe("PENDING");
    const row = await outbox.findByIdempotencyKey(device.id, "k1");
    expect(row?.status).toBe("SERVER_ACK");
    expect(await outbox.findQueued(device.id, 100)).toHaveLength(0);
  });
});
