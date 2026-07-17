import { Request, Response, NextFunction } from "express";
import {
  authMiddleware,
  bearerFromQueryToken,
  rejectScopedTokens,
  requireScope,
} from "./auth.middleware";
import { UnauthorizedError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

const mockJwtProvider = { verify: vi.fn() };
const mockUserRepository = { findById: vi.fn() };

vi.mock("tsyringe", () => ({
  container: {
    resolve: vi.fn((token: string) => {
      if (token === "JwtProvider") return mockJwtProvider;
      if (token === "UserRepository") return mockUserRepository;
      return {};
    }),
  },
}));

function mockReqResNext(
  headers: Record<string, string> = {},
  originalUrl = "/api/auth/me",
  cookies: Record<string, string> = {},
) {
  const req = { headers, originalUrl, cookies } as unknown as Request;
  const res = {} as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe("authMiddleware", () => {
  const middleware = authMiddleware();

  beforeEach(() => {
    vi.clearAllMocks();
    mockJwtProvider.verify.mockReturnValue({ userId: "u1", tokenVersion: 0 });
    mockUserRepository.findById.mockResolvedValue({
      tokenVersion: 0,
      language: "pt-BR",
    });
  });

  it("populates req.auth and calls next() with a valid token", async () => {
    const { req, res, next } = mockReqResNext({
      authorization: "Bearer valid-token",
    });

    await middleware(req, res, next);

    expect(mockJwtProvider.verify).toHaveBeenCalledWith("valid-token");
    expect(req.auth).toEqual({
      userId: "u1",
      language: "pt-BR",
      scope: undefined,
    });
    expect(next).toHaveBeenCalledWith();
  });

  it("returns AUTH_NO_TOKEN when no authorization header", async () => {
    const { req, res, next } = mockReqResNext({});

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    const error = (next as any).mock.calls[0][0] as UnauthorizedError;
    expect(error.code).toBe(ErrorCodes.AUTH_NO_TOKEN);
  });

  it("reads the token from the pombo_at cookie when there is no Authorization header", async () => {
    const { req, res, next } = mockReqResNext({}, "/api/auth/me", {
      pombo_at: "cookie-token",
    });

    await middleware(req, res, next);

    expect(mockJwtProvider.verify).toHaveBeenCalledWith("cookie-token");
    expect(req.auth).toMatchObject({ userId: "u1" });
    expect(next).toHaveBeenCalledWith();
  });

  it("prefers the Bearer header over the pombo_at cookie", async () => {
    const { req, res, next } = mockReqResNext(
      { authorization: "Bearer header-token" },
      "/api/auth/me",
      { pombo_at: "cookie-token" },
    );

    await middleware(req, res, next);

    expect(mockJwtProvider.verify).toHaveBeenCalledWith("header-token");
    expect(next).toHaveBeenCalledWith();
  });

  it("propagates jwt verify errors", async () => {
    mockJwtProvider.verify.mockImplementation(() => {
      throw new UnauthorizedError(
        "Token expired",
        undefined,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
      );
    });

    const { req, res, next } = mockReqResNext({
      authorization: "Bearer bad-token",
    });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("returns AUTH_TOKEN_INVALID when user not found", async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({
      authorization: "Bearer valid-token",
    });

    await middleware(req, res, next);

    const error = (next as any).mock.calls[0][0] as UnauthorizedError;
    expect(error.code).toBe(ErrorCodes.AUTH_TOKEN_INVALID);
  });

  it("returns AUTH_TOKEN_REVOKED when tokenVersion mismatches", async () => {
    mockUserRepository.findById.mockResolvedValue({
      tokenVersion: 1,
      language: "pt-BR",
    });

    const { req, res, next } = mockReqResNext({
      authorization: "Bearer valid-token",
    });

    await middleware(req, res, next);

    const error = (next as any).mock.calls[0][0] as UnauthorizedError;
    expect(error.code).toBe(ErrorCodes.AUTH_TOKEN_REVOKED);
  });

  describe("scope handling (SEC-C1 — fail-closed by default)", () => {
    beforeEach(() => {
      mockJwtProvider.verify.mockReturnValue({
        userId: "u1",
        tokenVersion: 0,
        scope: "imports:stream",
      });
    });

    it("rejects a scoped token by default with AUTH_TOKEN_INVALID", async () => {
      const { req, res, next } = mockReqResNext({
        authorization: "Bearer scoped-token",
      });

      await middleware(req, res, next);

      const error = (next as any).mock.calls[0][0] as UnauthorizedError;
      expect(error.code).toBe(ErrorCodes.AUTH_TOKEN_INVALID);
    });

    it("lets an allow-listed scope through and copies it into req.auth", async () => {
      const scopedMiddleware = authMiddleware({
        allowScopes: ["imports:stream"],
      });
      const { req, res, next } = mockReqResNext({
        authorization: "Bearer scoped-token",
      });

      await scopedMiddleware(req, res, next);

      expect(req.auth.scope).toBe("imports:stream");
      expect(next).toHaveBeenCalledWith();
    });

    it("still rejects a DIFFERENT scope even when one scope is allow-listed", async () => {
      const scopedMiddleware = authMiddleware({
        allowScopes: ["imports:other"],
      });
      const { req, res, next } = mockReqResNext({
        authorization: "Bearer scoped-token",
      });

      await scopedMiddleware(req, res, next);

      const error = (next as any).mock.calls[0][0] as UnauthorizedError;
      expect(error.code).toBe(ErrorCodes.AUTH_TOKEN_INVALID);
    });
  });
});

describe("bearerFromQueryToken", () => {
  const middleware = bearerFromQueryToken();

  function makeReq(
    headers: Record<string, string>,
    query: Record<string, unknown>,
  ) {
    return { headers, query } as unknown as Request;
  }

  it("promotes ?access_token= to the Authorization header when missing", () => {
    const req = makeReq({}, { access_token: "abc" });
    const next = vi.fn();
    middleware(req, {} as Response, next as unknown as NextFunction);
    expect(req.headers.authorization).toBe("Bearer abc");
    expect(next).toHaveBeenCalledWith();
  });

  it("does not override an existing Authorization header", () => {
    const req = makeReq(
      { authorization: "Bearer real" },
      { access_token: "leaked" },
    );
    const next = vi.fn();
    middleware(req, {} as Response, next as unknown as NextFunction);
    expect(req.headers.authorization).toBe("Bearer real");
  });

  it("ignores empty / non-string query tokens", () => {
    const req = makeReq({}, { access_token: "" });
    const next = vi.fn();
    middleware(req, {} as Response, next as unknown as NextFunction);
    expect(req.headers.authorization).toBeUndefined();
  });
});

describe("requireScope", () => {
  function makeReq(scope: string | undefined) {
    return { auth: { scope } } as unknown as Request;
  }

  it("calls next() when scope matches", () => {
    const next = vi.fn();
    requireScope("imports:stream")(
      makeReq("imports:stream"),
      {} as Response,
      next as unknown as NextFunction,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects with AUTH_TOKEN_INVALID when scope mismatches", () => {
    const next = vi.fn();
    requireScope("imports:stream")(
      makeReq("imports:other"),
      {} as Response,
      next as unknown as NextFunction,
    );
    const error = (next as any).mock.calls[0][0] as UnauthorizedError;
    expect(error.code).toBe(ErrorCodes.AUTH_TOKEN_INVALID);
  });

  it("rejects unscoped (full-access) tokens", () => {
    const next = vi.fn();
    requireScope("imports:stream")(
      makeReq(undefined),
      {} as Response,
      next as unknown as NextFunction,
    );
    const error = (next as any).mock.calls[0][0] as UnauthorizedError;
    expect(error.code).toBe(ErrorCodes.AUTH_TOKEN_INVALID);
  });
});

describe("rejectScopedTokens", () => {
  const middleware = rejectScopedTokens();

  function makeReq(scope: string | undefined) {
    return { auth: { scope } } as unknown as Request;
  }

  it("calls next() for full-access (unscoped) tokens", () => {
    const next = vi.fn();
    middleware(
      makeReq(undefined),
      {} as Response,
      next as unknown as NextFunction,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects any scoped token with AUTH_TOKEN_INVALID", () => {
    const next = vi.fn();
    middleware(
      makeReq("imports:stream"),
      {} as Response,
      next as unknown as NextFunction,
    );
    const error = (next as any).mock.calls[0][0] as UnauthorizedError;
    expect(error.code).toBe(ErrorCodes.AUTH_TOKEN_INVALID);
  });
});
