import { UpdateMessageStatusUseCase } from "./update-message-status.use-case";
import { InMemoryOutboxRepository } from "@modules/messaging/test/in-memory-outbox.repository";
import type {
  DomainEvent,
  IDomainEventBus,
} from "@shared/provider/domain-event-bus.interface";

class RecordingBus implements IDomainEventBus {
  public published: DomainEvent[] = [];
  publish(event: DomainEvent): void {
    this.published.push(event);
  }
  subscribe(): void {}
}

const seedSent = async (outbox: InMemoryOutboxRepository) => {
  const created = await outbox.create({
    deviceId: "d-1",
    idempotencyKey: "k-1",
    toJid: "5599@s.whatsapp.net",
    text: "oi",
    expiresAt: new Date(Date.now() + 60_000),
  });
  await outbox.setWaMessageId(created.id, "wa-1");
  return created;
};

describe("UpdateMessageStatusUseCase", () => {
  it("rises the status and republishes message.status on a real change", async () => {
    const outbox = new InMemoryOutboxRepository();
    const bus = new RecordingBus();
    const created = await seedSent(outbox);

    await new UpdateMessageStatusUseCase(outbox, bus).execute({
      waMessageId: "wa-1",
      status: "DELIVERY_ACK",
    });

    expect((await outbox.findById(created.id))?.status).toBe("DELIVERY_ACK");
    expect(bus.published).toEqual([
      {
        type: "message.status",
        deviceId: "d-1",
        messageId: created.id,
        status: "DELIVERY_ACK",
      },
    ]);
  });

  it("is a silent no-op for an unknown waMessageId", async () => {
    const outbox = new InMemoryOutboxRepository();
    const bus = new RecordingBus();

    await new UpdateMessageStatusUseCase(outbox, bus).execute({
      waMessageId: "unknown",
      status: "READ",
    });

    expect(bus.published).toEqual([]);
  });

  it("does not regress a higher status (monotonic) and publishes nothing", async () => {
    const outbox = new InMemoryOutboxRepository();
    const bus = new RecordingBus();
    const created = await seedSent(outbox);
    await outbox.applyMonotonicStatus("wa-1", "READ", [
      "PENDING",
      "SERVER_ACK",
      "DELIVERY_ACK",
    ]);

    await new UpdateMessageStatusUseCase(outbox, bus).execute({
      waMessageId: "wa-1",
      status: "SERVER_ACK",
    });

    expect((await outbox.findById(created.id))?.status).toBe("READ");
    expect(bus.published).toEqual([]);
  });
});
