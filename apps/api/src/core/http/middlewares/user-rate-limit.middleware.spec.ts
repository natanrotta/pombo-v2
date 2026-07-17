const { mockUserRateLimit } = vi.hoisted(() => {
  const mockUserRateLimit = vi.fn().mockReturnValue(vi.fn());
  return { mockUserRateLimit };
});

vi.mock("express-rate-limit", () => ({ default: mockUserRateLimit }));

vi.mock("./rate-limit-store", () => ({
  createRateLimitStore: () => undefined,
}));

vi.mock("../../config", () => ({
  env: {
    RATE_LIMIT_USER_WINDOW_MS: 60_000,
    RATE_LIMIT_USER_MAX: 200,
  },
}));

describe("userRateLimit", () => {
  let config: any;

  beforeAll(async () => {
    await import("./user-rate-limit.middleware.js");
    config = mockUserRateLimit.mock.calls[0]![0];
  });

  it("should configure 60 second window", () => {
    expect(config.windowMs).toBe(60_000);
  });

  it("should allow max 200 requests", () => {
    expect(config.max).toBe(200);
  });

  it("should use userId as key when authenticated", () => {
    const req = { auth: { userId: "user-123" }, ip: "1.2.3.4" } as any;
    expect(config.keyGenerator(req)).toBe("user-123");
  });

  it("should fallback to IP when not authenticated", () => {
    const req = { ip: "1.2.3.4" } as any;
    expect(config.keyGenerator(req)).toBe("1.2.3.4");
  });

  it("should fallback to 'anonymous' when no userId and no IP", () => {
    const req = {} as any;
    expect(config.keyGenerator(req)).toBe("anonymous");
  });

  it("should use handler function for i18n responses", () => {
    expect(typeof config.handler).toBe("function");
  });
});
