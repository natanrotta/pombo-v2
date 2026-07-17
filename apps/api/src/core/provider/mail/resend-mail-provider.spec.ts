import { ResendMailProvider } from "./resend-mail-provider";
import { env } from "@core/config";
import type { ILoggerProvider, SendMailInput } from "@shared/provider";

const sendMock = vi.fn();

vi.mock("@core/config", () => ({
  env: {
    NODE_ENV: "test",
    RESEND_API_KEY: "re_test",
    MAIL_FROM: "no-reply@pombo.com",
    MAIL_DEV_REDIRECT_TO: "",
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const mutableEnv = env as unknown as {
  NODE_ENV: string;
  MAIL_DEV_REDIRECT_TO: string;
};

function makeLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as unknown as ILoggerProvider & {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
}

const input: SendMailInput = {
  to: "user@example.com",
  subject: "Olá",
  html: "<p>hi</p>",
  text: "hi",
};

describe("ResendMailProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutableEnv.NODE_ENV = "test";
    mutableEnv.MAIL_DEV_REDIRECT_TO = "";
  });

  it("throws at construction when RESEND_API_KEY is missing", () => {
    const original = (env as { RESEND_API_KEY?: string }).RESEND_API_KEY;
    (env as { RESEND_API_KEY?: string }).RESEND_API_KEY = "";
    expect(() => new ResendMailProvider(makeLogger())).toThrow(
      /RESEND_API_KEY/,
    );
    (env as { RESEND_API_KEY?: string }).RESEND_API_KEY = original;
  });

  it("sends the email through Resend and logs success", async () => {
    sendMock.mockResolvedValue({ data: { id: "msg-1" }, error: null });
    const logger = makeLogger();

    await new ResendMailProvider(logger).send(input);

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "no-reply@pombo.com",
        to: "user@example.com",
        subject: "Olá",
      }),
    );
    expect(logger.info).toHaveBeenCalled();
  });

  it("reroutes to the dev redirect address and warns when configured outside production", async () => {
    mutableEnv.MAIL_DEV_REDIRECT_TO = "dev@pombo.com";
    sendMock.mockResolvedValue({ data: { id: "msg-1" }, error: null });
    const logger = makeLogger();

    await new ResendMailProvider(logger).send(input);

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "dev@pombo.com",
        subject: "[DEV → user@example.com] Olá",
      }),
    );
    expect(logger.warn).toHaveBeenCalled();
  });

  it("logs and throws when Resend returns an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "rejected" } });
    const logger = makeLogger();

    await expect(new ResendMailProvider(logger).send(input)).rejects.toThrow(
      /Failed to send email: rejected/,
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
