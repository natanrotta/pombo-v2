import { HttpWebhookSender } from "./http-webhook-sender";
import { mockAppConfig } from "@test/mocks";
import type { ILoggerProvider } from "@shared/provider/logger-provider.interface";
import { WebhookEvent } from "@modules/webhooks/domain/entity/webhook-event";

const makeLogger = (): ILoggerProvider => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
});

const event: WebhookEvent = {
  type: "device.connected",
  deviceId: "d1",
  data: { identifier: "5599" },
  eventId: "evt_1",
  timestamp: new Date("2025-01-01T00:00:00.000Z").toISOString(),
};

describe("HttpWebhookSender", () => {
  afterEach(() => vi.restoreAllMocks());

  it("delivers once on a 2xx and signs the request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 200 } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const sender = new HttpWebhookSender(
      makeLogger(),
      mockAppConfig({ WEBHOOK_MAX_ATTEMPTS: 3 }),
    );

    await sender.send({ url: "http://hook", secret: "s", event });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.headers["X-Signature"]).toMatch(/^sha256=/);
    expect(init.headers["X-Event-Id"]).toBe("evt_1");
  });

  it("does NOT retry a 4xx rejection", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 400 } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const sender = new HttpWebhookSender(
      makeLogger(),
      mockAppConfig({ WEBHOOK_MAX_ATTEMPTS: 3 }),
    );

    await sender.send({ url: "http://hook", secret: "s", event });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a 5xx up to maxAttempts then gives up (never throws)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 503 } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const sender = new HttpWebhookSender(
      makeLogger(),
      mockAppConfig({
        WEBHOOK_MAX_ATTEMPTS: 3,
        WEBHOOK_RETRY_BASE_DELAY_MS: 0,
      }),
    );

    await expect(
      sender.send({ url: "http://hook", secret: "s", event }),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
