import { TokenBucketSendRateLimiter } from "./token-bucket-send-rate-limiter";

// A controllable clock so refill math is deterministic.
const clock = () => {
  let t = 0;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
};

describe("TokenBucketSendRateLimiter", () => {
  it("allows a burst up to the capacity, then denies", () => {
    const c = clock();
    // 3 per 60s.
    const limiter = new TokenBucketSendRateLimiter(3, 60_000, c.now);

    expect(limiter.tryConsume("d")).toBe(true);
    expect(limiter.tryConsume("d")).toBe(true);
    expect(limiter.tryConsume("d")).toBe(true);
    // capacity exhausted
    expect(limiter.tryConsume("d")).toBe(false);
  });

  it("refills over time at max/window", () => {
    const c = clock();
    const limiter = new TokenBucketSendRateLimiter(3, 60_000, c.now); // 1 token / 20s
    limiter.tryConsume("d");
    limiter.tryConsume("d");
    limiter.tryConsume("d");
    expect(limiter.tryConsume("d")).toBe(false);

    c.advance(20_000); // one token back
    expect(limiter.tryConsume("d")).toBe(true);
    expect(limiter.tryConsume("d")).toBe(false);
  });

  it("never refills past the capacity", () => {
    const c = clock();
    const limiter = new TokenBucketSendRateLimiter(2, 10_000, c.now);
    c.advance(10_000_000); // idle a long time
    expect(limiter.tryConsume("d")).toBe(true);
    expect(limiter.tryConsume("d")).toBe(true);
    expect(limiter.tryConsume("d")).toBe(false); // capped at 2, not accumulated
  });

  it("reports msUntilNextToken (0 when available, the wait otherwise)", () => {
    const c = clock();
    const limiter = new TokenBucketSendRateLimiter(1, 10_000, c.now); // 1 / 10s
    expect(limiter.msUntilNextToken("d")).toBe(0);
    limiter.tryConsume("d");
    expect(limiter.msUntilNextToken("d")).toBe(10_000);
    c.advance(4_000);
    expect(limiter.msUntilNextToken("d")).toBe(6_000);
  });

  it("keeps a separate budget per device", () => {
    const c = clock();
    const limiter = new TokenBucketSendRateLimiter(1, 60_000, c.now);
    expect(limiter.tryConsume("a")).toBe(true);
    expect(limiter.tryConsume("a")).toBe(false);
    // b is untouched
    expect(limiter.tryConsume("b")).toBe(true);
  });
});
