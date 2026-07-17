import { ConsoleMailProvider } from "./console-mail-provider";
import { env } from "@core/config";
import type { ILoggerProvider, SendMailInput } from "@shared/provider";

vi.mock("@core/config", () => ({ env: { NODE_ENV: "test" } }));

const mutableEnv = env as unknown as { NODE_ENV: string };

function makeLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as unknown as ILoggerProvider & {
    info: ReturnType<typeof vi.fn>;
  };
}

const input: SendMailInput = {
  to: "user@example.com",
  subject: "Olá",
  html: "<p>hi</p>",
  text: "hi",
};

describe("ConsoleMailProvider", () => {
  beforeEach(() => {
    mutableEnv.NODE_ENV = "test";
  });

  it("logs the outgoing email instead of delivering it (non-production)", async () => {
    const logger = makeLogger();
    await new ConsoleMailProvider(logger).send(input);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Olá",
        text: "hi",
      }),
      expect.stringContaining("not actually delivered"),
    );
  });

  it("maps attachment metadata (filename + byte size) without logging the binary", async () => {
    const logger = makeLogger();
    await new ConsoleMailProvider(logger).send({
      ...input,
      attachments: [{ filename: "a.pdf", content: Buffer.from("12345") }],
    });

    expect(logger.info.mock.calls[0]![0].attachments).toEqual([
      { filename: "a.pdf", sizeBytes: 5 },
    ]);
  });

  it("fails loudly in production so emails are never silently dropped", async () => {
    mutableEnv.NODE_ENV = "production";
    const logger = makeLogger();

    await expect(new ConsoleMailProvider(logger).send(input)).rejects.toThrow(
      /must not be used in production/,
    );
    expect(logger.info).not.toHaveBeenCalled();
  });
});
