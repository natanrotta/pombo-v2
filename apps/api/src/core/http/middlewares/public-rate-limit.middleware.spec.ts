const { mockPublicRateLimit } = vi.hoisted(() => {
  const mockPublicRateLimit = vi.fn().mockReturnValue(vi.fn());
  return { mockPublicRateLimit };
});

vi.mock("express-rate-limit", () => ({ default: mockPublicRateLimit }));

vi.mock("./rate-limit-store", () => ({
  createRateLimitStore: () => undefined,
}));

vi.mock("../../config", () => ({
  env: {
    RATE_LIMIT_PUBLIC_WINDOW_MS: 15 * 60 * 1000,
    RATE_LIMIT_PUBLIC_MAX: 30,
  },
}));

vi.mock("@shared/i18n", () => ({
  i18n: { t: (key: string) => `tr:${key}` },
}));

describe("publicRateLimit", () => {
  let config: any;

  beforeAll(async () => {
    await import("./public-rate-limit.middleware.js");
    config = mockPublicRateLimit.mock.calls[0]![0];
  });

  it("uses the PUBLIC window from env (15 minutes)", () => {
    expect(config.windowMs).toBe(15 * 60 * 1000);
  });

  it("uses the PUBLIC max from env (30 per window)", () => {
    expect(config.max).toBe(30);
  });

  it("does not override keyGenerator — IP-keyed for anonymous traffic", () => {
    expect(config.keyGenerator).toBeUndefined();
  });

  it("opts out of express-rate-limit ip validation warnings", () => {
    expect(config.validate).toEqual(
      expect.objectContaining({ ip: false, keyGeneratorIpFallback: false }),
    );
  });

  it("returns the standard 429 envelope with the PUBLIC_RATE_LIMIT code", () => {
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
        message: "tr:errors:PUBLIC_RATE_LIMIT",
        code: "PUBLIC_RATE_LIMIT",
      },
    });
  });

  it("falls back to pt-BR when req.locale is missing", () => {
    const req = {} as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    config.handler(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "PUBLIC_RATE_LIMIT" }),
      }),
    );
  });
});
