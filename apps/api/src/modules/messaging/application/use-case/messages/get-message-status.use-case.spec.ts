import { GetMessageStatusUseCase } from "./get-message-status.use-case";
import { InMemoryOutboxRepository } from "@modules/messaging/test/in-memory-outbox.repository";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

const setup = async () => {
  const outbox = new InMemoryOutboxRepository();
  const devices = new InMemoryDevicesRepository();
  const device = await devices.create({
    accountId: ACCOUNT_A,
    name: "d",
    webhookUrl: null,
    webhookSecret: "s",
  });
  const created = await outbox.create({
    deviceId: device.id,
    idempotencyKey: "k-1",
    toJid: "5599@s.whatsapp.net",
    text: "oi",
    expiresAt: new Date(Date.now() + 60_000),
  });
  const sut = new GetMessageStatusUseCase(outbox, devices);
  return { outbox, devices, device, created, sut };
};

describe("GetMessageStatusUseCase", () => {
  it("returns the status projection when the message exists", async () => {
    const { created, sut } = await setup();

    const result = await sut.execute(ACCOUNT_A, created.id);

    expect(result.messageId).toBe(created.id);
    expect(result.status).toBe("PENDING");
  });

  it("throws MESSAGE_NOT_FOUND for an unknown id", async () => {
    const { sut } = await setup();

    await expect(sut.execute(ACCOUNT_A, "nope")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(sut.execute(ACCOUNT_A, "nope")).rejects.toMatchObject({
      code: ErrorCodes.MESSAGE_NOT_FOUND,
    });
  });

  it("throws MESSAGE_NOT_FOUND when the message's device belongs to another account (R3)", async () => {
    const { created, sut } = await setup();

    await expect(sut.execute(ACCOUNT_B, created.id)).rejects.toMatchObject({
      code: ErrorCodes.MESSAGE_NOT_FOUND,
    });
  });
});
