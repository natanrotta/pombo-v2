import { GetMessageStatusUseCase } from "./get-message-status.use-case";
import { InMemoryOutboxRepository } from "@modules/messaging/test/in-memory-outbox.repository";
import { NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

describe("GetMessageStatusUseCase", () => {
  it("returns the status projection when the message exists", async () => {
    const outbox = new InMemoryOutboxRepository();
    const created = await outbox.create({
      deviceId: "d-1",
      idempotencyKey: "k-1",
      toJid: "5599@s.whatsapp.net",
      text: "oi",
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await new GetMessageStatusUseCase(outbox).execute(
      created.id,
    );

    expect(result.messageId).toBe(created.id);
    expect(result.status).toBe("PENDING");
  });

  it("throws MESSAGE_NOT_FOUND for an unknown id", async () => {
    const outbox = new InMemoryOutboxRepository();
    const sut = new GetMessageStatusUseCase(outbox);

    await expect(sut.execute("nope")).rejects.toBeInstanceOf(NotFoundError);
    await expect(sut.execute("nope")).rejects.toMatchObject({
      code: ErrorCodes.MESSAGE_NOT_FOUND,
    });
  });
});
