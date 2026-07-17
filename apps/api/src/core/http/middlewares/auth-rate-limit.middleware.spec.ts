const { mockAuthRateLimit } = vi.hoisted(() => {
  const mockAuthRateLimit = vi.fn().mockReturnValue(vi.fn());
  return { mockAuthRateLimit };
});

vi.mock("express-rate-limit", () => ({ default: mockAuthRateLimit }));

vi.mock("./rate-limit-store", () => ({
  createRateLimitStore: () => undefined,
}));

vi.mock("../../config", () => ({
  env: {
    RATE_LIMIT_AUTH_WINDOW_MS: 15 * 60 * 1000,
    RATE_LIMIT_AUTH_MAX: 10,
  },
}));

vi.mock("@shared/i18n", () => ({
  i18n: { t: (key: string) => `tr:${key}` },
}));

describe("authRateLimit", () => {
  let config: any;

  beforeAll(async () => {
    await import("./auth-rate-limit.middleware.js");
    config = mockAuthRateLimit.mock.calls[0]![0];
  });

  it("uses the AUTH window from env", () => {
    expect(config.windowMs).toBe(15 * 60 * 1000);
  });

  it("uses the AUTH max from env", () => {
    expect(config.max).toBe(10);
  });

  it("does not override keyGenerator (IP-keyed by default — pre-auth surface)", () => {
    expect(config.keyGenerator).toBeUndefined();
  });

  it("opts out of express-rate-limit ip validation warnings", () => {
    expect(config.validate).toEqual(
      expect.objectContaining({ ip: false, keyGeneratorIpFallback: false }),
    );
  });

  it("returns the standard 429 envelope with the AUTH_RATE_LIMIT code", () => {
    const req = { locale: "pt-BR" } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    config.handler(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: {
        message: "tr:errors:AUTH_RATE_LIMIT",
        code: "AUTH_RATE_LIMIT",
      },
    });
  });

  it("falls back to pt-BR when req.locale is missing", () => {
    const req = {} as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    config.handler(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "AUTH_RATE_LIMIT" }),
      }),
    );
  });
});
