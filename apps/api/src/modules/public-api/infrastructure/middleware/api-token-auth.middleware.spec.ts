import { createHash } from "node:crypto";
import { Request, Response } from "express";
import { apiTokenAuthMiddleware } from "./api-token-auth.middleware";
import { InMemoryApiTokenRepository } from "@modules/account/test/in-memory-api-token.repository";
import { InMemoryCacheProvider } from "@test/mocks/in-memory-cache.provider";
import { mockAppConfig } from "@test/mocks";
import { generateApiToken } from "@modules/account/application/service/api-token.generator";
import { UnauthorizedError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

// The middleware resolves the api-token repo, the cache, the config and the
// logger from the container.
const { holder } = vi.hoisted(() => ({
  holder: {
    repo: null as unknown as InMemoryApiTokenRepository,
    cache: null as unknown as InMemoryCacheProvider,
    config: null as unknown as ReturnType<typeof mockAppConfig>,
  },
}));

vi.mock("tsyringe", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  container: {
    resolve: vi.fn((token: string) => {
      if (token === "ApiTokenRepository") return holder.repo;
      if (token === "CacheProvider") return holder.cache;
      if (token === "AppConfig") return holder.config;
      // LoggerProvider
      return { warn: vi.fn(), error: vi.fn(), info: vi.fn() };
    }),
  },
}));

function mockReq(authorization?: string): Request {
  return {
    headers: authorization ? { authorization } : {},
  } as unknown as Request;
}

const run = async (authorization?: string) => {
  const req = mockReq(authorization);
  const next = vi.fn();
  await apiTokenAuthMiddleware()(req, {} as Response, next);
  return { req, next };
};

/** Seed the repo with an active token and return its clear value. */
const seedToken = async (accountId = "acc-1") => {
  const { token, tokenHash, tokenPrefix } = generateApiToken();
  const created = await holder.repo.rotate({
    accountId,
    tokenHash,
    tokenPrefix,
    createdByUserId: "u1",
  });
  return { token, tokenId: created.id };
};

describe("apiTokenAuthMiddleware", () => {
  beforeEach(() => {
    holder.repo = new InMemoryApiTokenRepository();
    holder.cache = new InMemoryCacheProvider();
    holder.config = mockAppConfig({ CACHE_API_TOKEN_TTL_SECONDS: 60 });
    vi.clearAllMocks();
  });

  it("rejects a request with no Authorization header (API_TOKEN_MISSING)", async () => {
    const { next } = await run(undefined);
    const error = next.mock.calls[0]![0] as UnauthorizedError;
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.code).toBe(ErrorCodes.API_TOKEN_MISSING);
  });

  it("rejects a non-Bearer Authorization header (API_TOKEN_MISSING)", async () => {
    const { next } = await run("Basic abc");
    expect((next.mock.calls[0]![0] as UnauthorizedError).code).toBe(
      ErrorCodes.API_TOKEN_MISSING,
    );
  });

  it("rejects an unknown token (API_TOKEN_INVALID)", async () => {
    const { next } = await run("Bearer pmb_unknowntoken");
    expect((next.mock.calls[0]![0] as UnauthorizedError).code).toBe(
      ErrorCodes.API_TOKEN_INVALID,
    );
  });

  it("rejects a revoked token (API_TOKEN_INVALID, indistinguishable from unknown)", async () => {
    const first = await seedToken("acc-1");
    // Rotating again revokes `first`.
    await seedToken("acc-1");

    const { next } = await run(`Bearer ${first.token}`);
    expect((next.mock.calls[0]![0] as UnauthorizedError).code).toBe(
      ErrorCodes.API_TOKEN_INVALID,
    );
  });

  it("accepts a valid token, populates req.apiAuth, and stamps last_used", async () => {
    const { token, tokenId } = await seedToken("acc-1");

    const { req, next } = await run(`Bearer ${token}`);

    expect(next).toHaveBeenCalledWith(); // no error
    expect(req.apiAuth).toEqual({ accountId: "acc-1", tokenId });

    // touchLastUsed is fire-and-forget — flush the pending microtask, then
    // confirm the active token carries a last-used stamp.
    await Promise.resolve();
    const hash = createHash("sha256").update(token).digest("hex");
    const active = await holder.repo.findActiveByHash(hash);
    expect(active?.lastUsedAt).toBeInstanceOf(Date);
  });

  it("caches the resolution on a miss and serves the next request from cache (no DB lookup)", async () => {
    const { token, tokenId } = await seedToken("acc-1");
    const hash = createHash("sha256").update(token).digest("hex");
    const findSpy = vi.spyOn(holder.repo, "findActiveByHash");

    // First request → miss → DB lookup + cache back-fill.
    const first = await run(`Bearer ${token}`);
    expect(first.req.apiAuth).toEqual({ accountId: "acc-1", tokenId });
    expect(findSpy).toHaveBeenCalledTimes(1);
    expect(holder.cache.has(`apitoken:${hash}`)).toBe(true);

    // Second request → hit → NO DB lookup, apiAuth from cache.
    const second = await run(`Bearer ${token}`);
    expect(second.req.apiAuth).toEqual({ accountId: "acc-1", tokenId });
    expect(findSpy).toHaveBeenCalledTimes(1); // still 1 — served from cache
  });

  it("does not stamp last_used on a cache hit (only on the DB miss)", async () => {
    const { token } = await seedToken("acc-1");
    const touchSpy = vi.spyOn(holder.repo, "touchLastUsed");

    await run(`Bearer ${token}`); // miss → 1 touch
    await run(`Bearer ${token}`); // hit → no touch
    await Promise.resolve();

    expect(touchSpy).toHaveBeenCalledTimes(1);
  });
});
