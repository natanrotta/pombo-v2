import { createHash } from "node:crypto";
import { Request, Response } from "express";
import { apiTokenAuthMiddleware } from "./api-token-auth.middleware";
import { InMemoryApiTokenRepository } from "@modules/account/test/in-memory-api-token.repository";
import { generateApiToken } from "@modules/account/application/service/api-token.generator";
import { UnauthorizedError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

// The middleware resolves the api-token repo + the logger from the container.
const { holder } = vi.hoisted(() => ({
  holder: { repo: null as unknown as InMemoryApiTokenRepository },
}));

vi.mock("tsyringe", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  container: {
    resolve: vi.fn((token: string) => {
      if (token === "ApiTokenRepository") return holder.repo;
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
});
