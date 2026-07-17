import { OutboxMessage } from "./outbox-message.entity";

const makeOutbox = () =>
  new OutboxMessage({
    id: "m-1",
    deviceId: "d-1",
    idempotencyKey: "k-1",
    toJid: "5599@s.whatsapp.net",
    text: "oi",
    waMessageId: "wa-1",
    status: "SERVER_ACK",
    failureReason: null,
    expiresAt: new Date("2025-01-02T00:00:00.000Z"),
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  });

describe("OutboxMessage entity", () => {
  it("exposes props via getters", () => {
    const message = makeOutbox();
    expect(message.id).toBe("m-1");
    expect(message.deviceId).toBe("d-1");
    expect(message.status).toBe("SERVER_ACK");
    expect(message.text).toBe("oi");
  });

  it("toJSON exposes only the status projection (no text/jid)", () => {
    const json = makeOutbox().toJSON();
    expect(json).toEqual({
      messageId: "m-1",
      status: "SERVER_ACK",
      failureReason: null,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    });
    expect(json).not.toHaveProperty("text");
    expect(json).not.toHaveProperty("toJid");
  });
});
